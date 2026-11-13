// Built by build_transit_geojson.py from each agency's GTFS feed. Buses are
// drawn in a neutral light grey rather than the agencies' own route colours
// (DDOT's are mostly dark teal/navy -- invisible on this basemap) and rather
// than any hue in CATEGORY_COLORS, so a bus line never reads as "another
// employer category". DDOT vs SMART is told apart by dash, not colour. The two
// rail lines are few and short, so they keep (lightened) brand colours.
//
// Names and hover hints are in strings.js ('transit.ddot', 'transit.ddot.hint',
// ...) so they follow the language toggle; this file is styling only.
export const TRANSIT_AGENCIES = {
  ddot: { color: '#d1d5db', dash: null },
  smart: { color: '#d1d5db', dash: '6 5' },
  qline: { color: '#ef4d2e', dash: null },
  dpm: { color: '#c084fc', dash: null },
}
export const TRANSIT_ORDER = ['ddot', 'smart', 'qline', 'dpm']
