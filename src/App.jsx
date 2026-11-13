import { memo, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import { CATEGORY_COLORS, UNCATEGORISED_LABEL, colorForCategory, TRAINING_PROVIDER_COLOR } from './categoryColors'
import useIsMobile from './useIsMobile'
import TransitLayer from './TransitLayer'
import { TRANSIT_AGENCIES, TRANSIT_ORDER } from './transitAgencies'
import FeedbackButton from './Feedback'
import LanguageToggle from './LanguageToggle'
import { useI18n } from './i18n'
import { buildSearchTest } from './searchSynonyms'
import './App.css'

// Zones are geographic, not judgements about an employer. Everything stays on
// the map; the styling just makes Southwest Detroit read first.
// The wording for each zone (and its longer hint) lives in strings.js, keyed by
// these same values -- label(zone) / hint(zone).
const ZONE_ORDER = ['Southwest Detroit', 'Around Southwest Detroit', 'Detroit', 'Outside the area']
const zoneOf = (properties) => (ZONE_ORDER.includes(properties.zone) ? properties.zone : 'Detroit')
const zoneClass = (zone) => 'zone-' + zone.toLowerCase().replace(/\s+/g, '-')
const categoryOf = (properties) => properties.category || UNCATEGORISED_LABEL

// The training-provider category values, as they exist in
// training_providers.geojson today. Hardcoded rather than derived from the
// loaded data (unlike trainingCategories in App, used only for legend
// styling) specifically so the resting-state default below can be computed
// synchronously, with no dependency on either fetch finishing -- an earlier
// version seeded hiddenCategories from an effect keyed on the loaded data,
// which raced against which of the two independent fetches (employers vs.
// training providers) resolved first and could permanently miss whichever
// category set arrived second. A hardcoded list can't race; a category
// added to the data later just isn't hidden by default until this list is
// updated to match, same as a genuinely new employer category would show up
// unhidden too (see the comment on hiddenCategories below).
const TRAINING_CATEGORIES = ['Trade/vocational school', 'Community organization', 'Community college']

// The lowest education tier an employer is hiring at -- deliberately lowest, not
// most common, so one reachable opening is not hidden behind nine that are not.
// Populated by apply_education_to_map.py; absent until that has been run.
// "Unclassified" (has open jobs, none labelled yet) is deliberately last and
// styled differently below -- it is a pipeline gap, not a fourth rung on the
// no-degree -> degree scale the other three represent.
const EDU_ORDER = ['No degree required', 'Training or certificate', 'College degree', 'Unclassified']
const eduClass = (tier) => 'edu-' + tier.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')
const educationOf = (properties) => properties.lowest_education || null

// "Hiring" means the last scrape found at least one open posting -- the same
// number the sidebar's job badge shows. It drives the marker size on the map
// (see HIRING_STYLE), the popup's status line and the "Hiring now only" toggle.
const isHiring = (properties) => (properties.open_job_count || 0) > 0

// Search is case- and accent-insensitive ("pena" finds "Peña"), and only
// kicks in at two characters so a single keystroke doesn't match everything.
const SEARCH_MIN_CHARS = 2
const normalise = (text) =>
  (text || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const splitList = (value) => (value ? value.split(' | ') : [])
const isWebUrl = (url) => Boolean(url) && /^https?:\/\//.test(url)
// "Welding,CDL/Truck Driving" -> "Welding, CDL/Truck Driving" (the training
// data has no space after its commas, which also stops long lists wrapping).
const spaceCommas = (text) => (text || '').replace(/,(?=\S)/g, ', ')
// education_confidence arrives as an English sentence, "90% from posting text
// (9/10)". Pulled apart here so it can be re-said in the current language;
// anything in an unexpected shape is shown as it came.
const CONFIDENCE_PATTERN = /^(\d+)% from posting text \((.+)\)$/

// Great-circle distance in miles -- used by the ZIP filter to rank/limit
// employers by how far they are from the ZIP the visitor typed in.
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

const ZIP_RADIUS_OPTIONS = [5, 10, 25, 50]

// Esri's World Dark Gray tiles stop at zoom 16 -- anything deeper comes back
// as a grey "Map data not yet available" placeholder (checked 2026-09-30).
// Rather than hard-stopping at 16, the map allows two more levels and Leaflet
// stretches the z16 tiles to fill them (maxNativeZoom), so crowded pins can
// still be pulled apart without ever requesting a tile that doesn't exist.
const ESRI_MAX_NATIVE_ZOOM = 16
const MAP_MAX_ZOOM = 18

// Fill weight steps down as you move away from Southwest Detroit.
const ZONE_STYLE = {
  'Southwest Detroit': { fillOpacity: 0.9, weight: 1, dash: null },
  'Around Southwest Detroit': { fillOpacity: 0.55, weight: 1, dash: null },
  'Detroit': { fillOpacity: 0.2, weight: 1.5, dash: null },
  'Outside the area': { fillOpacity: 0, weight: 1.5, dash: '3 3' },
}

// Hiring status is carried by SIZE, because fill weight (above) and hue
// (category) are both already spoken for: an employer with open jobs gets the
// full-size dot, one with none gets a smaller, fainter one. So a glance at
// the map answers "who is hiring" without opening anything, and it survives
// the zone styling -- an "Outside the area" employer is still a dashed ring
// either way, just a large or a small one.
const HIRING_STYLE = {
  hiring: { radius: 8, fade: 1 },
  notHiring: { radius: 5, fade: 0.5 },
}

// A pin, not a circle, so the two datasets are unambiguous on the map even
// before a viewer reads the legend -- see the note on TRAINING_PROVIDER_COLOR
// in categoryColors.js. Built as a function rather than a module-level
// constant because the active state needs its own (slightly larger) icon,
// and there are only ever ~16 of these markers, so recreating one on click is
// free.
function trainingIcon(isActive) {
  return L.divIcon({
    className: 'training-marker-icon',
    html: `<span class="training-marker-glyph${isActive ? ' active' : ''}" style="background:${TRAINING_PROVIDER_COLOR}">🎓</span>`,
    iconSize: isActive ? [26, 26] : [22, 22],
    iconAnchor: isActive ? [13, 13] : [11, 11],
  })
}

// Hover tooltips have no touch equivalent (Leaflet only closes one on
// mouseout), so the tooltip is desktop-only and carries just the name. The
// full profile lives in a click/tap <Popup>, which works the same on both and
// has its own close button.
//
// Opening is driven two ways: Leaflet opens the popup itself when the marker
// is clicked, and this hook opens it when the employer is selected from the
// sidebar list instead (isActive flips without a click on the marker).
// `mapActive` is false while the map is hidden behind the mobile List tab --
// a popup opened on a zero-size map container lands in the wrong place, so
// this waits and catches up when the map is shown again, the same way
// FlyToTarget does.
function useOpenPopupWhenActive(isActive, mapActive) {
  const layerRef = useRef(null)
  useEffect(() => {
    if (isActive && mapActive) layerRef.current?.openPopup()
  }, [isActive, mapActive])
  return layerRef
}

// autoPan is off because selecting already flies the map to the marker
// (FlyToTarget) -- two competing pans make the map lurch. The offset lifts
// the popup's tip clear of the marker (Leaflet's default points it at the
// centre, which hides the top half of the selected, 11px-radius dot).
const POPUP_PROPS = { autoPan: false, maxWidth: 280, minWidth: 200, offset: [0, -6] }

// Contact names, phone numbers and emails are deliberately NOT here: they
// were removed from the public data on 2026-10-19 (see PRIVATE_COLUMNS in
// build_geojson.py). The routes to an employer this shows are its website and
// the per-job Apply links in the list.
function EmployerPopup({ properties, zone, education, isMobile, onShowInList }) {
  const { t, label, phrases } = useI18n()
  const { company, full_address, category, sub_category, business_type, open_job_count, website } = properties
  const hiring = isHiring(properties)
  return (
    <div className="map-popup">
      <div className="map-popup-title">{company}</div>
      <div className={`map-popup-status${hiring ? ' hiring' : ''}`}>
        {hiring ? t('hiring.nowWithCount', { count: open_job_count }) : t('hiring.noneLong')}
      </div>
      <dl className="map-popup-facts">
        <dt>{t('popup.industry')}</dt>
        <dd>
          <span className="category-swatch" style={{ backgroundColor: colorForCategory(category) }} />
          {label(category || UNCATEGORISED_LABEL)}{sub_category ? ` · ${label(sub_category)}` : ''}
        </dd>
        {business_type && (<><dt>{t('popup.business')}</dt><dd>{phrases(business_type.trim())}</dd></>)}
        {full_address && (<><dt>{t('popup.address')}</dt><dd>{full_address}</dd></>)}
        <dt>{t('popup.area')}</dt>
        <dd>{label(zone)}</dd>
        {hiring && education && (<><dt>{t('popup.education')}</dt><dd>{label(education)}</dd></>)}
      </dl>
      <div className="map-popup-actions">
        {hiring && (
          <button type="button" className="map-popup-button" onClick={onShowInList}>
            {isMobile ? t('popup.seeJobsInList') : t('popup.seeJobs')}
          </button>
        )}
        {isWebUrl(website) && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="map-popup-link">
            {t('popup.website')}&nbsp;&#8599;
          </a>
        )}
      </div>
    </div>
  )
}

function TrainingPopup({ properties }) {
  const { t, label, phrases } = useI18n()
  const { provider, address, category, credential_focus, cost_notes, homepage_url, program_page_url } = properties
  const link = program_page_url || homepage_url
  return (
    <div className="map-popup">
      <div className="map-popup-title">{provider}</div>
      <div className="map-popup-status training">{t('training.badge')}</div>
      <dl className="map-popup-facts">
        <dt>{t('popup.type')}</dt>
        <dd>
          <span className="category-swatch training-swatch" style={{ backgroundColor: TRAINING_PROVIDER_COLOR }} />
          {label(category)}
        </dd>
        {address && (<><dt>{t('popup.address')}</dt><dd>{address}</dd></>)}
        {credential_focus && (<><dt>{t('popup.trainsFor')}</dt><dd>{phrases(spaceCommas(credential_focus))}</dd></>)}
        {cost_notes && (<><dt>{t('popup.cost')}</dt><dd>{label(cost_notes)}</dd></>)}
      </dl>
      {isWebUrl(link) && (
        <div className="map-popup-actions">
          <a href={link} target="_blank" rel="noopener noreferrer" className="map-popup-link">
            {t('training.programmePage')}&nbsp;&#8599;
          </a>
        </div>
      )}
    </div>
  )
}

const TrainingMarker = memo(function TrainingMarker({ lat, lng, properties, isActive, isMobile, mapActive, onSelect }) {
  const markerRef = useOpenPopupWhenActive(isActive, mapActive)
  return (
    <Marker ref={markerRef} position={[lat, lng]} icon={trainingIcon(isActive)} eventHandlers={{ click: onSelect }}>
      {!isMobile && <Tooltip direction="top" offset={[0, -10]}>{properties.provider}</Tooltip>}
      <Popup {...POPUP_PROPS}>
        <TrainingPopup properties={properties} />
      </Popup>
    </Marker>
  )
})

const EmployerMarker = memo(function EmployerMarker({ lat, lng, properties, zone, education, isActive, isMobile, mapActive, onSelect, onShowInList }) {
  const { t } = useI18n()
  const markerRef = useOpenPopupWhenActive(isActive, mapActive)
  const fill = colorForCategory(properties.category)
  const style = ZONE_STYLE[zone]
  const hiring = isHiring(properties)
  const { radius, fade } = hiring ? HIRING_STYLE.hiring : HIRING_STYLE.notHiring
  return (
    <CircleMarker
      ref={markerRef}
      center={[lat, lng]}
      radius={isActive ? 11 : radius}
      pathOptions={{
        color: isActive ? '#fff' : (style.fillOpacity > 0.5 ? 'rgba(0, 0, 0, 0.35)' : fill),
        fillColor: fill,
        opacity: isActive ? 1 : fade,
        fillOpacity: isActive ? Math.max(style.fillOpacity, 0.6) : style.fillOpacity * fade,
        weight: isActive ? 2 : style.weight,
        dashArray: style.dash,
      }}
      eventHandlers={{ click: onSelect }}
    >
      {!isMobile && (
        <Tooltip direction="top" offset={[0, -6]}>
          <strong>{properties.company}</strong>
          {hiring ? t('jobs.open', { count: properties.open_job_count }) : t('hiring.none')}
        </Tooltip>
      )}
      <Popup {...POPUP_PROPS}>
        <EmployerPopup
          properties={properties}
          zone={zone}
          education={education}
          isMobile={isMobile}
          onShowInList={onShowInList}
        />
      </Popup>
    </CircleMarker>
  )
})

// Collapsed by default -- three filter panels were pushing the actual employer
// listings below the fold. `defaultOpen` only seeds the initial state; each
// section remembers its own open/closed after that.
function FilterSection({ title, activeCount, totalCount, defaultOpen = false, children }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={`chevron${open ? ' open' : ''}`}>&#9656;</span>
        <span className="filter-section-title">{title}</span>
        {activeCount < totalCount && (
          <span className="filter-section-badge">{t('filter.shown', { active: activeCount, total: totalCount })}</span>
        )}
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  )
}

// The one control that ignores the Category panel: every category starts
// switched off (see hiddenCategories in App), and a visitor typing "welder"
// should not also have to guess which of ten categories welders fall under.
// Area, Education, ZIP and "Hiring now only" still apply on top of a search.
function SearchBox({ query, onQueryChange, searching, employerCount, trainingCount }) {
  const { t } = useI18n()
  const total = employerCount + trainingCount
  return (
    <div className="filter-section zip-filter search-filter">
      <label className="zip-filter-title" htmlFor="map-search">{t('search.title')}</label>
      <div className="zip-filter-body">
        <div className="search-input-wrap">
          <input
            id="map-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            className="zip-input search-input"
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => onQueryChange('')} aria-label={t('search.clear')}>
              &times;
            </button>
          )}
        </div>
        {searching && (
          <p className={`zip-status${total === 0 ? ' zip-error' : ''}`} role="status">
            {total === 0 ? t('search.none') : t('search.matches', { count: total })}
          </p>
        )}
      </div>
    </div>
  )
}

// A filter and the map's key in one place: the toggle narrows the list, and
// the two dots underneath explain the marker sizes (see HIRING_STYLE) whether
// or not the toggle is on.
function HiringFilter({ hiringOnly, onToggle, hiringCount }) {
  const { t } = useI18n()
  return (
    <div className="filter-section hiring-filter">
      <button
        type="button"
        className={`hiring-toggle${hiringOnly ? ' active' : ''}`}
        aria-pressed={hiringOnly}
        onClick={onToggle}
      >
        <span className="hiring-toggle-box" aria-hidden="true">{hiringOnly ? '\u2713' : ''}</span>
        <span className="scope-label">{t('hiring.only')}</span>
        <span className="scope-count">{hiringCount}</span>
      </button>
      <div className="map-key">
        <span className="map-key-item"><span className="map-key-dot hiring" />{t('hiring.now')}</span>
        <span className="map-key-item"><span className="map-key-dot not-hiring" />{t('hiring.none')}</span>
      </div>
    </div>
  )
}

// Not built on FilterSection -- that component's chrome (badge, chevron,
// collapsible body of toggle buttons) doesn't fit a text input, and this is
// worth showing open by default since it's a direct search rather than a
// declutter-by-default toggle list like the others. Geocoding a full 5-digit
// ZIP happens in App itself (see the zip* state/effect there); this just
// renders whatever status that effect has reached.
function ZipFilter({ zip, onZipChange, radius, onRadiusChange, status, matchCount }) {
  const { t } = useI18n()
  return (
    <div className="filter-section zip-filter">
      <label className="zip-filter-title" htmlFor="map-zip">{t('zip.title')}</label>
      <div className="zip-filter-body">
        <input
          id="map-zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder={t('zip.placeholder')}
          value={zip}
          onChange={e => onZipChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="zip-input"
        />
        {zip.length === 5 && status !== 'error' && (
          <div className="zip-radius-row">
            {ZIP_RADIUS_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                className={`zip-radius-btn${radius === r ? ' active' : ''}`}
                onClick={() => onRadiusChange(r)}
              >
                {t('zip.radius', { miles: r })}
              </button>
            ))}
          </div>
        )}
        {status === 'loading' && <p className="zip-status">{t('zip.loading', { zip })}</p>}
        {status === 'error' && <p className="zip-status zip-error">{t('zip.error', { zip })}</p>}
        {status === 'ok' && (
          <p className="zip-status">{t('zip.result', { count: matchCount, miles: radius, zip })}</p>
        )}
      </div>
    </div>
  )
}

function ZoneFilter({ counts, hiddenZones, onToggle }) {
  const { t, label, hint } = useI18n()
  const total = ZONE_ORDER.filter(z => counts[z]).length
  const active = total - hiddenZones.size
  return (
    <FilterSection title={t('filter.area')} activeCount={active} totalCount={total}>
      {ZONE_ORDER.map(zone => {
        const isActive = !hiddenZones.has(zone)
        return (
          <button
            key={zone}
            type="button"
            className={`scope-item ${zoneClass(zone)}${isActive ? '' : ' inactive'}`}
            onClick={() => onToggle(zone)}
            title={hint(zone)}
          >
            <span className="scope-marker" />
            <span className="scope-label">{label(zone)}</span>
            <span className="scope-count">{counts[zone] || 0}</span>
          </button>
        )
      })}
    </FilterSection>
  )
}

// Renders nothing until the education pipeline has been run, so the map is
// never showing an empty filter for data that does not exist yet.
function EducationFilter({ counts, hiddenEducation, onToggle }) {
  const { t, label, hint } = useI18n()
  const present = EDU_ORDER.filter(tier => counts[tier])
  if (!present.length) return null
  const active = present.length - hiddenEducation.size
  return (
    <FilterSection title={t('filter.education')} activeCount={active} totalCount={present.length}>
      {present.map(tier => {
        const isActive = !hiddenEducation.has(tier)
        return (
          <button
            key={tier}
            type="button"
            className={`scope-item ${eduClass(tier)}${isActive ? '' : ' inactive'}`}
            onClick={() => onToggle(tier)}
            title={hint(tier)}
          >
            {tier === 'Unclassified' ? (
              <span className="unclassified-marker">?</span>
            ) : (
              <span className="edu-bar" />
            )}
            <span className="scope-label">{label(tier)}</span>
            <span className="scope-count">{counts[tier]}</span>
          </button>
        )
      })}
    </FilterSection>
  )
}

// An overlay, not a filter -- it adds context (can a resident get there
// without a car?) rather than narrowing the employer list, so it counts
// nothing and hides nothing. Off by default like everything else; the ~340 KB
// of route/stop data isn't even downloaded until the first agency is turned
// on (see the transit fetch effect in App).
function TransitFilter({ shownAgencies, onToggle, status }) {
  const { t } = useI18n()
  return (
    <FilterSection title={t('filter.transit')} activeCount={shownAgencies.size} totalCount={TRANSIT_ORDER.length}>
      {TRANSIT_ORDER.map(agency => {
        const meta = TRANSIT_AGENCIES[agency]
        const isActive = shownAgencies.has(agency)
        return (
          <button
            key={agency}
            type="button"
            className={`scope-item${isActive ? '' : ' inactive'}`}
            onClick={() => onToggle(agency)}
            title={t(`transit.${agency}.hint`)}
          >
            <svg className="transit-swatch" width="18" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="18" y2="3" stroke={meta.color} strokeWidth="2" strokeDasharray={meta.dash || undefined} />
            </svg>
            <span className="scope-label">{t(`transit.${agency}`)}</span>
          </button>
        )
      })}
      {status === 'loading' && <p className="transit-note">{t('transit.loading')}</p>}
      {status === 'error' && <p className="transit-note zip-error">{t('transit.error')}</p>}
      {status === 'ok' && shownAgencies.size > 0 && (
        <p className="transit-note">{t('transit.zoomHint')}</p>
      )}
    </FilterSection>
  )
}

// The legend lists only categories actually present in the data, so an empty
// bucket disappears on its own -- and reappears if a future scrape reintroduces
// one -- without anyone editing this file. Training-provider categories (see
// trainingCategories, derived from the data rather than hardcoded) are mixed
// into the same list rather than living behind a separate "Show" toggle --
// but they keep the amber colour and square-ish swatch used everywhere else
// for that dataset (scope-item.layer-training, .training-swatch) so they
// still read as a different kind of thing from an employer category, per the
// reasoning in categoryColors.js.
function CategoryLegend({ categories, counts, hiddenCategories, trainingCategories, onToggle, onToggleAll }) {
  const { t, label } = useI18n()
  const active = categories.length - hiddenCategories.size
  const allActive = active === categories.length
  return (
    <FilterSection title={t('filter.category')} activeCount={active} totalCount={categories.length}>
      <button type="button" className="category-select-all" onClick={() => onToggleAll(!allActive)}>
        {allActive ? t('filter.clearAll') : t('filter.selectAll')}
      </button>
      <div className="category-legend">
        {categories.map(category => {
          const isActive = !hiddenCategories.has(category)
          const isTraining = trainingCategories.has(category)
          return (
            <button
              key={category}
              type="button"
              className={`legend-item${isActive ? '' : ' inactive'}`}
              onClick={() => onToggle(category)}
            >
              <span
                className={`category-swatch${isTraining ? ' training-swatch' : ''}`}
                style={{ backgroundColor: isTraining ? TRAINING_PROVIDER_COLOR : colorForCategory(category) }}
              />
              <span className="legend-label">{label(category)}</span>
              <span className="legend-count">{counts[category] || 0}</span>
            </button>
          )
        })}
      </div>
    </FilterSection>
  )
}

// `active` is false while this pane is hidden behind the mobile List/Map
// toggle (display:none via .hidden-mobile). Leaflet's flyTo animates by
// computing pixel bounds from the container's current size -- on a
// zero-size hidden container that division produces NaN and crashes the
// whole tree ("Invalid LatLng object: (NaN, NaN)"), not just a cosmetic
// glitch. So this does nothing while inactive, WITHOUT marking the target as
// handled (prevTarget stays put) -- the effect then naturally re-fires and
// catches up once the pane becomes visible again, via `active` itself being
// a dependency. invalidateSize() runs first on that same transition, since
// display:none leaves Leaflet's cached container size stale.
function FlyToTarget({ target, active }) {
  const map = useMap()
  const prevTarget = useRef(null)

  useEffect(() => {
    if (!active) return
    map.invalidateSize()
    if (target && target !== prevTarget.current) {
      prevTarget.current = target
      map.flyTo([target.lat, target.lng], 15, { duration: 1.2 })
    }
  }, [target, active, map])

  return null
}

function App() {
  const { t, label, hint, phrases, lang } = useI18n()
  const [employers, setEmployers] = useState([])
  const [trainingProviders, setTrainingProviders] = useState([])
  // { lat, lng, id, kind } -- kind distinguishes an employer's `company` from
  // a provider's `provider` name so the two id spaces can't collide, and so
  // isActive checks below (and the itemRefs key) know which list an id came
  // from.
  const [selected, setSelected] = useState(null)
  // Tracks which categories are switched OFF rather than on. Starts with
  // EVERY known category already hidden (employers via CATEGORY_COLORS,
  // training providers via TRAINING_CATEGORIES above) -- resting state is
  // nothing plotted and nothing listed, prompting a deliberate choice
  // rather than dumping 140+ pins on load. This is computed synchronously
  // from static, already-imported lists, not from the fetched data, so
  // there's no async ordering for it to race against. A category the data
  // introduces later that isn't in either list starts visible, same as
  // presentCategories below already treats an unrecognised value.
  const [hiddenCategories, setHiddenCategories] = useState(
    () => new Set([...Object.keys(CATEGORY_COLORS), ...TRAINING_CATEGORIES])
  )
  // Hidden-set, like categories: empty means every area is shown.
  const [hiddenZones, setHiddenZones] = useState(() => new Set())
  const [hiddenEducation, setHiddenEducation] = useState(() => new Set())
  // ZIP filter. zipInput is the raw text box value; zipCoords/zipStatus are
  // the raw result of the last completed geocode (see the effect below).
  // Everything downstream (visibleEmployers, the list's distance line) reads
  // the derived activeZipCoords/displayZipStatus instead (see below), not
  // these directly, so a half-typed, still-loading, or unrecognised ZIP
  // never filters anything out.
  const [zipInput, setZipInput] = useState('')
  const [zipRadius, setZipRadius] = useState(10)
  const [zipCoords, setZipCoords] = useState(null)
  const [zipStatus, setZipStatus] = useState('idle') // idle | ok | error
  // Which zip zipCoords/zipStatus actually describe -- lets the render below
  // derive a "still loading" state for a not-yet-geocoded zipInput without
  // an effect having to setState synchronously just to flip on a spinner
  // (see the effect itself: every setState there happens inside an async
  // fetch callback, never directly in the effect body).
  const [geocodedZip, setGeocodedZip] = useState(null)
  // Free-text search over employer names and job titles (see SearchBox).
  const [searchInput, setSearchInput] = useState('')
  // Off by default so the map still shows every employer, hiring or not --
  // an employer with nothing posted today is still a place to ask.
  const [hiringOnly, setHiringOnly] = useState(false)
  // Whether the Training Providers list (separate from the map/marker
  // visibility, which is now just another Category toggle) is expanded.
  // Defaults open -- unlike the filter panels above, this is real content
  // a viewer came here to browse, not chrome to declutter by default.
  const [trainingListOpen, setTrainingListOpen] = useState(true)
  // Which individual job rows have their requirements snippet expanded,
  // keyed "company#index". Only jobs with a real fetched description ever
  // get a key added here -- see hasDesc in the employer-list render below.
  const [expandedJobs, setExpandedJobs] = useState(() => new Set())
  const itemRefs = useRef({})
  const isMobile = useIsMobile()
  // Only meaningful when isMobile -- below 900px the map and sidebar become
  // full-screen tabs instead of a side-by-side layout. Defaults to the list
  // because browsing/filtering the ~126-row list, not the map, is the
  // primary task this app is used for.
  const [viewMode, setViewMode] = useState('list')
  // Shown-set (the reverse of the hidden-sets above) since the overlay starts
  // off: empty means no transit drawn.
  const [shownAgencies, setShownAgencies] = useState(() => new Set())
  // { routes, stops } once loaded; transitError if either file failed.
  const [transitData, setTransitData] = useState(null)
  const [transitError, setTransitError] = useState(false)
  const transitRequested = useRef(false)

  useEffect(() => {
    fetch('/employers_geocoded.geojson')
      .then(res => res.json())
      .then(data => setEmployers(data.features))
  }, [])

  useEffect(() => {
    // 404s quietly to an empty layer rather than breaking the page -- this
    // file only exists once build_training_geojson.py has been run at least
    // once (see training-providers/README.md).
    fetch('/training_providers.geojson')
      .then(res => res.ok ? res.json() : { features: [] })
      .then(data => setTrainingProviders(data.features))
      .catch(() => setTrainingProviders([]))
  }, [])

  // Deferred until the visitor first turns an agency on -- most visits never
  // touch the overlay, and it's ~4x the size of the employer data. The ref
  // (not state) makes sure toggling agencies on/off while the first request
  // is in flight doesn't start a second one.
  useEffect(() => {
    if (shownAgencies.size === 0 || transitRequested.current) return
    transitRequested.current = true
    const load = (path) => fetch(path).then(res => {
      if (!res.ok) throw new Error(`${path} ${res.status}`)
      return res.json()
    })
    Promise.all([load('/transit_routes.geojson'), load('/transit_stops.geojson')])
      .then(([routes, stops]) => setTransitData({ routes: routes.features, stops: stops.features }))
      .catch(() => setTransitError(true))
  }, [shownAgencies])

  // Geocodes zipInput once it's a complete 5-digit ZIP, via Zippopotam.us --
  // free, keyless, CORS-enabled, good enough for "which corner of metro
  // Detroit is this ZIP in". Debounced 400ms so it doesn't fire on every
  // keystroke while typing. `cancelled` guards against a stale response
  // landing after a newer ZIP has already been typed (fetches aren't
  // guaranteed to resolve in request order).
  useEffect(() => {
    if (zipInput.length !== 5) return
    let cancelled = false
    const timer = setTimeout(() => {
      fetch(`https://api.zippopotam.us/us/${zipInput}`)
        .then(res => {
          if (!res.ok) throw new Error('zip not found')
          return res.json()
        })
        .then(data => {
          if (cancelled) return
          const place = data.places?.[0]
          if (!place) throw new Error('zip not found')
          setZipCoords({ lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) })
          setZipStatus('ok')
          setGeocodedZip(zipInput)
        })
        .catch(() => {
          if (cancelled) return
          setZipCoords(null)
          setZipStatus('error')
          setGeocodedZip(zipInput)
        })
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [zipInput])

  // viewMode is a dependency so that "See jobs in list" in a map popup works
  // on mobile: the list is display:none while the Map tab is showing, and
  // scrolling a hidden element does nothing, so this has to run again once
  // the List tab is actually on screen.
  useEffect(() => {
    if (selected) {
      itemRefs.current[`${selected.kind}:${selected.id}`]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selected, viewMode])

  // Derived display/filter state for the ZIP search -- see geocodedZip above
  // for why this is computed here rather than reset via setState in effects.
  const zipComplete = zipInput.length === 5
  const zipPending = zipComplete && geocodedZip !== zipInput
  const displayZipStatus = !zipComplete ? 'idle' : zipPending ? 'loading' : zipStatus
  const activeZipCoords = (zipComplete && !zipPending && zipStatus === 'ok') ? zipCoords : null

  // Whether the map pane is actually visible right now. On desktop it always
  // is; on mobile it's whichever of List/Map the toggle is set to. Threaded
  // into FlyToTarget below, which needs this to avoid animating a hidden,
  // zero-size map container (see the comment on FlyToTarget itself).
  const mapActive = !isMobile || viewMode === 'map'

  const searchTerm = normalise(searchInput).trim()
  const searching = searchTerm.length >= SEARCH_MIN_CHARS

  // feature -> { nameMatch, jobIndexes } for every employer the search hits;
  // null when no search is active. jobIndexes are positions in job_titles, so
  // the list can show exactly the matching openings (and keep them aligned
  // with apply_urls / job_educations / job_descriptions, which share those
  // positions).
  const employerMatches = useMemo(() => {
    if (!searching) return null
    const matchesSearch = buildSearchTest(searchTerm)
    const matches = new Map()
    for (const feature of employers) {
      const { company, category, sub_category, business_type, job_titles } = feature.properties
      // Category and sub-category are searched in English AND in the current
      // language, so "transporte" finds the same employers as "transportation".
      const nameMatch = matchesSearch(normalise(
        `${company} ${category} ${sub_category} ${business_type} ${label(category)} ${label(sub_category)}`
      ))
      const jobIndexes = []
      splitList(job_titles).forEach((title, j) => {
        if (matchesSearch(normalise(title))) jobIndexes.push(j)
      })
      if (nameMatch || jobIndexes.length) matches.set(feature, { nameMatch, jobIndexes })
    }
    return matches
  }, [employers, searching, searchTerm, label])

  const trainingMatches = useMemo(() => {
    if (!searching) return null
    const matchesSearch = buildSearchTest(searchTerm)
    return new Set(trainingProviders.filter(feature => {
      const { provider, category, credential_focus, address } = feature.properties
      return matchesSearch(normalise(
        `${provider} ${category} ${credential_focus} ${address} ${label(category)} ${phrases(credential_focus)}`
      ))
    }))
  }, [trainingProviders, searching, searchTerm, label, phrases])

  // The most recent scrape date on any employer -- i.e. when the job listings
  // were last refreshed. Shown in the sidebar header so a visitor (and SDEV
  // staff) can see at a glance how current the openings are. The date is
  // built from its parts rather than new Date('2026-10-12'), which is read as
  // midnight UTC and shows as the previous day in Detroit.
  const lastUpdated = useMemo(() => {
    const latest = employers.map(f => f.properties.latest_scrape).filter(Boolean).sort().pop()
    const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(latest || '')
    if (!parts) return null
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      .toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }, [employers, lang])

  const hiringCount = useMemo(
    () => employers.filter(feature => isHiring(feature.properties)).length,
    [employers]
  )

  // Merges both datasets under one shared "category" dimension -- see
  // trainingCategories below for how the legend still tells them apart.
  const categoryCounts = useMemo(() => {
    const counts = {}
    for (const feature of [...employers, ...trainingProviders]) {
      const category = categoryOf(feature.properties)
      counts[category] = (counts[category] || 0) + 1
    }
    return counts
  }, [employers, trainingProviders])

  // Which category values belong to a training provider -- derived from the
  // data rather than a hardcoded list, so a new provider category picks up
  // the amber/square treatment in the legend automatically. (No employer
  // category has ever collided with a training-provider one; if that ever
  // changes, that category just reads as "training" too, which is a
  // reasonable enough default rather than a bug worth guarding against.)
  const trainingCategories = useMemo(
    () => new Set(trainingProviders.map(feature => categoryOf(feature.properties))),
    [trainingProviders]
  )

  // Known categories first, in palette order, then any unexpected value the data
  // introduces -- so a new or blank category surfaces in the legend rather than
  // being quietly dropped.
  const presentCategories = useMemo(() => {
    const present = new Set(Object.keys(categoryCounts))
    const known = Object.keys(CATEGORY_COLORS).filter(c => present.has(c))
    const extra = [...present].filter(c => !(c in CATEGORY_COLORS)).sort()
    return [...known, ...extra]
  }, [categoryCounts])

  const zoneCounts = useMemo(() => {
    const counts = {}
    for (const feature of employers) {
      const zone = zoneOf(feature.properties)
      counts[zone] = (counts[zone] || 0) + 1
    }
    return counts
  }, [employers])

  const educationCounts = useMemo(() => {
    const counts = {}
    for (const feature of employers) {
      const tier = educationOf(feature.properties)
      if (tier) counts[tier] = (counts[tier] || 0) + 1
    }
    return counts
  }, [employers])

  const visibleEmployers = useMemo(() => {
    const filtered = employers.filter(feature =>
      // A search replaces the Category panel rather than stacking on it --
      // see the comment on SearchBox.
      (employerMatches
        ? employerMatches.has(feature)
        : !hiddenCategories.has(categoryOf(feature.properties))) &&
      (!hiringOnly || isHiring(feature.properties)) &&
      !hiddenZones.has(zoneOf(feature.properties)) &&
      // An employer with no education data is never filtered out by it.
      !(educationOf(feature.properties) &&
        hiddenEducation.has(educationOf(feature.properties))) &&
      // activeZipCoords is only set once zipInput has actually been geocoded
      // (see the derivation above), so a ZIP still being typed/looked
      // up/unrecognised filters nothing out.
      (!activeZipCoords || distanceMiles(
        activeZipCoords.lat, activeZipCoords.lng,
        feature.geometry.coordinates[1], feature.geometry.coordinates[0]
      ) <= zipRadius)
    )
    // Nearest-first only makes sense once there's a point to be near.
    if (!activeZipCoords) return filtered
    return [...filtered].sort((a, b) =>
      distanceMiles(activeZipCoords.lat, activeZipCoords.lng, a.geometry.coordinates[1], a.geometry.coordinates[0]) -
      distanceMiles(activeZipCoords.lat, activeZipCoords.lng, b.geometry.coordinates[1], b.geometry.coordinates[0])
    )
  }, [employers, employerMatches, hiringOnly, hiddenCategories, hiddenZones, hiddenEducation, activeZipCoords, zipRadius])

  // Category and Area both apply here now -- category is shared with
  // employers via categoryOf/hiddenCategories (see trainingCategories
  // above), so hiding a provider's category also hides its map pins. There
  // is no education dimension for this dataset.
  const visibleTrainingProviders = useMemo(
    () => trainingProviders.filter(feature =>
      (trainingMatches
        ? trainingMatches.has(feature)
        : !hiddenCategories.has(categoryOf(feature.properties))) &&
      !hiddenZones.has(zoneOf(feature.properties))
    ),
    [trainingProviders, trainingMatches, hiddenCategories, hiddenZones]
  )

  const swVisible = useMemo(
    () => visibleEmployers.filter(feature => zoneOf(feature.properties) === 'Southwest Detroit').length,
    [visibleEmployers]
  )

  const toggleCategory = (category) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  // show=true clears the hidden set (every category visible); show=false
  // resets it to the same full known-category list used to seed initial
  // state, so "clear all" matches the app's actual resting state rather
  // than just the categories currently present in the data.
  const toggleAllCategories = (show) => {
    setHiddenCategories(
      show ? new Set() : new Set([...Object.keys(CATEGORY_COLORS), ...TRAINING_CATEGORIES])
    )
  }

  const toggleEducation = (tier) => {
    setHiddenEducation(prev => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  const toggleZone = (zone) => {
    setHiddenZones(prev => {
      const next = new Set(prev)
      if (next.has(zone)) next.delete(zone)
      else next.add(zone)
      return next
    })
  }

  const toggleAgency = (agency) => {
    setShownAgencies(prev => {
      const next = new Set(prev)
      if (next.has(agency)) next.delete(agency)
      else next.add(agency)
      return next
    })
  }
  const transitStatus = transitError ? 'error' : transitData ? 'ok' : shownAgencies.size ? 'loading' : 'idle'

  const handleSelect = (feature) => {
    const [lng, lat] = feature.geometry.coordinates
    setSelected({ lat, lng, id: feature.properties.company, kind: 'employer' })
  }

  // The popup's "See jobs" button. Selecting is what expands the employer's
  // card and scrolls it into view; on mobile the list is a separate tab, so
  // this also switches to it.
  const handleShowInList = (feature) => {
    handleSelect(feature)
    if (isMobile) setViewMode('list')
  }

  const handleSelectTraining = (feature) => {
    const [lng, lat] = feature.geometry.coordinates
    setSelected({ lat, lng, id: feature.properties.provider, kind: 'training' })
  }

  const toggleJob = (jobKey) => {
    setExpandedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobKey)) next.delete(jobKey)
      else next.add(jobKey)
      return next
    })
  }

  return (
    <div className="app-container">
      {isMobile && (
        <div className="mobile-view-toggle">
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            {t('view.list')}
          </button>
          <button
            type="button"
            className={viewMode === 'map' ? 'active' : ''}
            aria-pressed={viewMode === 'map'}
            onClick={() => setViewMode('map')}
          >
            {t('view.map')}
          </button>
          {/* The sidebar (and the toggle in its header) is hidden on the Map
              tab, so on mobile the language switch lives up here where it is
              always reachable. */}
          <LanguageToggle compact />
        </div>
      )}
      <div className={`map-wrapper${isMobile && viewMode !== 'map' ? ' hidden-mobile' : ''}`}>
        <img src="/Small signature logo.png" alt={t('logo.alt')} className="logo-overlay" />
        {/* Resting state (categories all off by default above) leaves the
            map with nothing plotted -- a blank basemap reads as broken, not
            "nothing selected", so this fills that gap. Keyed on there being
            zero visible pins, NOT on `selected` -- it must clear the moment
            a category/area toggle makes something appear, before the viewer
            has clicked any specific one (a `!selected` trigger was the bug:
            it kept the card up over real, visible pins because nothing had
            been individually clicked yet). pointer-events: none (see CSS) so
            it never blocks panning/zooming the map underneath it. */}
        {visibleEmployers.length === 0 && visibleTrainingProviders.length === 0 && (
          <div className="map-empty-state">
            <div className="map-empty-state-card">
              <p className="map-empty-state-title">
                {searching ? t('empty.noMatchTitle') : t('empty.title')}
              </p>
              <p className="map-empty-state-hint">
                {searching ? t('empty.noMatchHint') : t('empty.hint')}
              </p>
            </div>
          </div>
        )}
        <MapContainer
          center={[42.2955, -83.1114]}
          zoom={11}
          minZoom={10}
          maxZoom={MAP_MAX_ZOOM}
          maxBounds={[[41.95, -84.0], [42.8, -82.65]]}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          {/* CARTO's free dark_all tiles now render an "API key required"
              watermark for anonymous requests, so this uses Esri's free,
              no-key World Dark Gray basemap instead (base canvas + a
              transparent reference layer for labels/roads, matching how
              Esri splits this particular style in two). The base layer is
              darkened in CSS (.basemap-base) to get back the near-black look
              the CARTO tiles had; labels are left at full brightness. */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            className="basemap-base"
            maxNativeZoom={ESRI_MAX_NATIVE_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={ESRI_MAX_NATIVE_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          />
          <FlyToTarget target={selected} active={mapActive} />
          <TransitLayer data={transitData} shownAgencies={shownAgencies} isMobile={isMobile} />
          {/* Keyed by name, not list position: with a popup attached, a
              position key would hand one employer's open popup to whichever
              employer slid into that slot when a filter changed. */}
          {visibleEmployers.map(feature => {
            const [lng, lat] = feature.geometry.coordinates
            const { company } = feature.properties
            return (
              <EmployerMarker
                key={company}
                lat={lat}
                lng={lng}
                properties={feature.properties}
                zone={zoneOf(feature.properties)}
                education={educationOf(feature.properties)}
                isActive={selected?.kind === 'employer' && selected?.id === company}
                isMobile={isMobile}
                mapActive={mapActive}
                onSelect={() => handleSelect(feature)}
                onShowInList={() => handleShowInList(feature)}
              />
            )
          })}
          {visibleTrainingProviders.map(feature => {
            const [lng, lat] = feature.geometry.coordinates
            const { provider } = feature.properties
            return (
              <TrainingMarker
                key={`training-${provider}`}
                lat={lat}
                lng={lng}
                properties={feature.properties}
                isActive={selected?.kind === 'training' && selected?.id === provider}
                isMobile={isMobile}
                mapActive={mapActive}
                onSelect={() => handleSelectTraining(feature)}
              />
            )
          })}
        </MapContainer>
      </div>

      <div className={`sidebar${isMobile && viewMode !== 'list' ? ' hidden-mobile' : ''}`}>
        {!isMobile && (
          <div className="sidebar-language">
            <LanguageToggle />
          </div>
        )}
        <div className="sidebar-header">
          <FeedbackButton />
          <h2>{t('header.employers')}</h2>
          <p>
            {t('header.locations', { count: visibleEmployers.length })}
            {swVisible !== visibleEmployers.length && (
              <span className="corridor-count"> · {t('header.inSouthwest', { count: swVisible })}</span>
            )}
          </p>
          {lastUpdated && <p className="updated-line">{t('header.updated', { date: lastUpdated })}</p>}
        </div>
        <SearchBox
          query={searchInput}
          onQueryChange={setSearchInput}
          searching={searching}
          employerCount={visibleEmployers.length}
          trainingCount={visibleTrainingProviders.length}
        />
        <HiringFilter
          hiringOnly={hiringOnly}
          onToggle={() => setHiringOnly(on => !on)}
          hiringCount={hiringCount}
        />
        <ZipFilter
          zip={zipInput}
          onZipChange={setZipInput}
          radius={zipRadius}
          onRadiusChange={setZipRadius}
          status={displayZipStatus}
          matchCount={visibleEmployers.length}
        />
        <EducationFilter
          counts={educationCounts}
          hiddenEducation={hiddenEducation}
          onToggle={toggleEducation}
        />
        <ZoneFilter counts={zoneCounts} hiddenZones={hiddenZones} onToggle={toggleZone} />
        <CategoryLegend
          categories={presentCategories}
          counts={categoryCounts}
          hiddenCategories={hiddenCategories}
          trainingCategories={trainingCategories}
          onToggle={toggleCategory}
          onToggleAll={toggleAllCategories}
        />
        <TransitFilter shownAgencies={shownAgencies} onToggle={toggleAgency} status={transitStatus} />

        {trainingProviders.length > 0 && (
          <>
            <button
              type="button"
              className="sidebar-header training-header"
              onClick={() => setTrainingListOpen(o => !o)}
              aria-expanded={trainingListOpen}
            >
              <h2>
                <span className={`chevron${trainingListOpen ? ' open' : ''}`}>&#9656;</span>
                {t('training.title')}
              </h2>
              <p>{t('header.locations', { count: visibleTrainingProviders.length })}</p>
            </button>
            {trainingListOpen && (
            <div className="employer-list training-list">
              {visibleTrainingProviders.map((feature, i) => {
                const {
                  provider, category, address, credential_focus,
                  cost_notes, homepage_url, program_page_url,
                } = feature.properties
                const isActive = selected?.kind === 'training' && selected?.id === provider
                const zone = zoneOf(feature.properties)
                const link = program_page_url || homepage_url
                return (
                  <div
                    key={i}
                    ref={el => { itemRefs.current[`training:${provider}`] = el }}
                    className={`employer-item training-item${isActive ? ' active' : ''}${zone !== 'Southwest Detroit' ? ' out-of-scope' : ''}`}
                    onClick={() => handleSelectTraining(feature)}
                  >
                    <div className="company-name">{provider}</div>
                    {zone !== 'Southwest Detroit' && (
                      <div className={`scope-tag ${zoneClass(zone)}`} title={hint(zone)}>
                        {label(zone)}
                      </div>
                    )}
                    <div className="category-line">
                      <span className="category-swatch training-swatch" style={{ backgroundColor: TRAINING_PROVIDER_COLOR }} />
                      {label(category)}
                    </div>
                    {address && <div className="sub-category-line">{address}</div>}
                    {credential_focus && (
                      <div className="credential-tags-line">{phrases(spaceCommas(credential_focus))}</div>
                    )}
                    {cost_notes && <div className="cost-notes-line">{label(cost_notes)}</div>}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-apply-link"
                        onClick={e => e.stopPropagation()}
                      >
                        {t('training.programmePage')}&nbsp;&#8599;
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
            )}
          </>
        )}

        <div className="employer-list">
          {visibleEmployers.map((feature, i) => {
            const {
              company, category, sub_category, open_job_count,
              job_titles, apply_urls, job_educations, job_descriptions,
            } = feature.properties
            const isActive = selected?.kind === 'employer' && selected?.id === company
            const zone = zoneOf(feature.properties)
            const [empLng, empLat] = feature.geometry.coordinates
            // Not filtered -- job_educations/job_descriptions are index-aligned
            // with job_titles/apply_urls (guaranteed by apply_education_to_map.py
            // building all four from one pass), so dropping empty titles here
            // would shift every array out of sync with the one before it.
            const titles = splitList(job_titles)
            const urls = splitList(apply_urls)
            const educations = splitList(job_educations)
            const descriptions = splitList(job_descriptions)
            // Which openings to list: all of them once the card is selected;
            // before that, only the ones a search matched by title, so a
            // search for "welder" shows the welder jobs without a click on
            // each employer. These are positions in `titles`, never a
            // filtered copy, for the alignment reason above.
            const matchedJobs = employerMatches?.get(feature)?.jobIndexes ?? []
            const shownJobs = isActive ? titles.map((_, j) => j) : matchedJobs
            const confidence = CONFIDENCE_PATTERN.exec(feature.properties.education_confidence || '')
            const confidenceText = confidence
              ? t('jobs.confidence', { percent: confidence[1], ratio: confidence[2] })
              : (feature.properties.education_confidence || '')
            return (
              <div
                key={i}
                ref={el => { itemRefs.current[`employer:${company}`] = el }}
                className={`employer-item${isActive ? ' active' : ''}${zone !== 'Southwest Detroit' ? ' out-of-scope' : ''}`}
                onClick={() => handleSelect(feature)}
              >
                <div className="company-name">{company}</div>
                {zone !== 'Southwest Detroit' && (
                  <div className={`scope-tag ${zoneClass(zone)}`} title={hint(zone)}>
                    {label(zone)}
                  </div>
                )}
                <div className="category-line">
                  <span className="category-swatch" style={{ backgroundColor: colorForCategory(category) }} />
                  {label(categoryOf(feature.properties))}
                </div>
                {sub_category && <div className="sub-category-line">{label(sub_category)}</div>}
                {activeZipCoords && (
                  <div className="zip-distance-line">
                    {t('zip.distance', {
                      miles: distanceMiles(activeZipCoords.lat, activeZipCoords.lng, empLat, empLng).toFixed(1),
                      zip: zipInput,
                    })}
                  </div>
                )}
                <span className={`job-badge${open_job_count === 0 ? ' no-jobs' : ''}`}>
                  {t('jobs.open', { count: open_job_count })}
                </span>
                {educationOf(feature.properties) && (
                  <span
                    className={`edu-badge ${eduClass(educationOf(feature.properties))}`}
                    title={confidenceText}
                  >
                    {label(educationOf(feature.properties))}
                  </span>
                )}
                {!isActive && matchedJobs.length > 0 && (
                  <div className="search-match-line">
                    {t('search.matchingJobs', { count: matchedJobs.length })}
                  </div>
                )}
                {/* Empty in English (see 'jobs.languageNote' in strings.js), so
                    this only appears where the titles below are not in the
                    language the visitor chose. */}
                {shownJobs.length > 0 && t('jobs.languageNote') && (
                  <p className="job-language-note">{t('jobs.languageNote')}</p>
                )}
                {shownJobs.length > 0 && (
                  <ul className="job-titles-list">
                    {shownJobs.map(j => {
                      const title = titles[j]
                      const url = urls[j]
                      const hasRealUrl = isWebUrl(url)
                      const tier = educations[j]
                      const description = descriptions[j]
                      // Only jobs fetch_job_descriptions.py actually fetched and
                      // classify_education.py read carry a non-empty snippet --
                      // see FETCHED_BASES in apply_education_to_map.py. A
                      // title-only job gets no expand affordance at all, rather
                      // than one that opens onto nothing.
                      const hasDescription = Boolean(description)
                      const jobKey = `${company}#${j}`
                      const isOpen = expandedJobs.has(jobKey)
                      return (
                        <li key={j}>
                          {/* Clicking the row (title, badge, whitespace) toggles the
                              description. Opening the actual posting is a separate,
                              explicit "Apply" link so the two actions never collide
                              on the same click target. */}
                          <div
                            className={`job-title-row${hasDescription ? ' expandable' : ''}`}
                            onClick={hasDescription ? (e) => { e.stopPropagation(); toggleJob(jobKey) } : undefined}
                          >
                            {hasDescription && (
                              <span className={`job-desc-toggle${isOpen ? ' open' : ''}`}>&#9656;</span>
                            )}
                            <span className="job-title-text">{title}</span>
                            {tier && (
                              <span className={`job-edu-badge ${eduClass(tier)}`}>{label(tier)}</span>
                            )}
                            {hasRealUrl && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="job-apply-link"
                                title={t('jobs.applyTitle')}
                                onClick={e => e.stopPropagation()}
                              >
                                {t('jobs.apply')}&nbsp;&#8599;
                              </a>
                            )}
                          </div>
                          {hasDescription && isOpen && (
                            <div className="job-description" onClick={e => e.stopPropagation()}>
                              {description}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App
