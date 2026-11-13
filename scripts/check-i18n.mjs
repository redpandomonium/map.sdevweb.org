// Lists anything the map would show in English while set to another language.
//
//   npm run check:i18n
//
// Run it after a scrape or after adding employers/training providers: a new
// category, sub-category, area, business type or cost note in the data shows
// up here with the exact line to add to src/strings.js. Exits with an error
// when something is missing, so it can also gate a deploy.
import { readFileSync } from 'node:fs'
import { UI, HINTS, DATA_LABELS, PHRASES, DEFAULT_LANGUAGE } from '../src/strings.js'
import { makeTranslator } from '../src/i18n.js'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url))).features.map(f => f.properties)
const employers = read('../public/employers_geocoded.geojson')
const providers = read('../public/training_providers.geojson')
const split = (value) => (value ? value.split(' | ') : [])

// Every data value the interface passes to label().
const labelled = new Set()
for (const e of employers) {
  for (const v of [e.zone, e.category, e.sub_category, e.lowest_education, ...split(e.job_educations)]) {
    if (v) labelled.add(v)
  }
}
for (const p of providers) {
  for (const v of [p.zone, p.category, p.cost_notes]) if (v) labelled.add(v)
}

// Every free-text value passed to phrases().
const phrased = new Set()
for (const e of employers) if (e.business_type) phrased.add(e.business_type.trim())
for (const p of providers) if (p.credential_focus) phrased.add(p.credential_focus)

// Words that are legitimately the same in both languages or are proper names.
const SAME_IN_BOTH = new Set(['Detroit'])
const ALLOWED_ENGLISH = /\b(HVAC|CDL|CNC|EMT|LPN|EVSE|DTE|USPS|K-12|Operation Next|ReBuild Detroit|Machinist Training Institute|incl)\b/g

let problems = 0
const report = (title, lines) => {
  if (!lines.length) return
  problems += lines.length
  console.log(`\n${title}`)
  for (const line of lines) console.log(`  ${line}`)
}

for (const lang of Object.keys(UI)) {
  if (lang === DEFAULT_LANGUAGE) continue
  const { phrases } = makeTranslator(lang)

  report(`[${lang}] interface text with no translation (UI in strings.js):`,
    Object.keys(UI[DEFAULT_LANGUAGE]).filter(key => UI[lang][key] === undefined))

  report(`[${lang}] hints with no translation (HINTS in strings.js):`,
    Object.keys(HINTS[DEFAULT_LANGUAGE]).filter(key => !HINTS[lang]?.[key]))

  report(`[${lang}] data values with no translation -- add to DATA_LABELS.${lang}:`,
    [...labelled].filter(v => !DATA_LABELS[lang]?.[v] && !SAME_IN_BOTH.has(v)).sort().map(v => `'${v}': '',`))

  // A phrase-translated value is "done" when no run of English letters is
  // left that also appears, as a whole word, in the original.
  const leftovers = []
  for (const original of [...phrased].sort()) {
    const translated = phrases(original)
    const englishWords = new Set(original.replace(ALLOWED_ENGLISH, ' ').match(/[A-Za-z][A-Za-z-]{2,}/g) || [])
    const still = (translated.replace(ALLOWED_ENGLISH, ' ').match(/[A-Za-z][A-Za-z-]{2,}/g) || [])
      .filter(word => englishWords.has(word))
    if (still.length) leftovers.push(`"${original}"\n      -> "${translated}"   (still English: ${[...new Set(still)].join(', ')})`)
  }
  report(`[${lang}] business types / training subjects only partly translated -- add phrases to PHRASES.${lang}:`, leftovers)

  const unused = Object.keys(PHRASES[lang] || {}).filter(phrase => ![...phrased].some(v => v.includes(phrase)))
  if (unused.length) console.log(`\n[${lang}] note: ${unused.length} phrase(s) no longer appear in the data (harmless): ${unused.join('; ')}`)
}

if (problems) {
  console.log(`\n${problems} item(s) would show in English. See the notes at the top of src/strings.js.`)
  process.exit(1)
}
console.log('All interface text and data values have translations.')
