import { createContext, useContext } from 'react'
import { UI, HINTS, DATA_LABELS, PHRASES, LANGUAGES, DEFAULT_LANGUAGE } from './strings.js'

// Where the visitor's choice is remembered between visits. localStorage can
// be unavailable (private browsing, blocked site data), so every access is
// wrapped -- the map must work the same without it, just without remembering.
const STORAGE_KEY = 'community-view-language'

export function readSavedLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && LANGUAGES[saved]) return saved
  } catch { /* storage blocked -- fall through to the browser's language */ }
  // First visit: follow the phone/browser. A device set to Spanish opens the
  // map in Spanish without anyone having to find the toggle first.
  const preferred = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || []
  for (const tag of preferred) {
    const code = (tag || '').slice(0, 2).toLowerCase()
    if (LANGUAGES[code]) return code
  }
  return DEFAULT_LANGUAGE
}

export function saveLanguage(lang) {
  try { window.localStorage.setItem(STORAGE_KEY, lang) } catch { /* not remembered, still works */ }
}

const fill = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? vars[name] : whole)) : text

// One regex per language, built once: every phrase, longest first, so the
// longest possible phrase wins at each position. The text is rewritten in a
// single pass, which is what stops a Spanish result from being translated a
// second time by a shorter phrase. The letter checks either side keep "EMT"
// from matching inside a longer word. (Written without a lookbehind on
// purpose -- iPhones before iOS 16.4 can't parse one, and a regex that fails
// to parse would take the whole page down.)
const phraseMatchers = {}
function phraseMatcher(lang) {
  if (!(lang in phraseMatchers)) {
    const phrases = Object.keys(PHRASES[lang] || {}).sort((a, b) => b.length - a.length)
    const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    phraseMatchers[lang] = phrases.length
      ? new RegExp(`(^|[^A-Za-z])(${escaped.join('|')})(?![A-Za-z])`, 'g')
      : null
  }
  return phraseMatchers[lang]
}

// Builds the four lookup functions for one language. Every one of them falls
// back to English rather than showing a blank or a raw key, so a missing
// translation is a cosmetic gap, never a broken screen.
export function makeTranslator(lang) {
  const ui = UI[lang] || UI[DEFAULT_LANGUAGE]
  const fallback = UI[DEFAULT_LANGUAGE]

  // t('jobs.open', { count: 3 }) -> "3 open jobs"
  const t = (key, vars) => {
    let entry = ui[key]
    if (entry === undefined || entry === '') entry = fallback[key]
    if (entry === undefined) return key
    if (typeof entry === 'object') entry = vars?.count === 1 ? entry.one : entry.other
    return fill(entry, vars)
  }

  // label('Freight & Trucking') -> the same value in the current language.
  const label = (value) => (value && DATA_LABELS[lang]?.[value]) || value

  const hint = (value) => HINTS[lang]?.[value] || HINTS[DEFAULT_LANGUAGE][value] || ''

  // phrases('Manufacturing (Automotive Parts)') -> phrase-by-phrase, see PHRASES.
  const phrases = (text) => {
    if (!text) return text
    const matcher = phraseMatcher(lang)
    if (!matcher) return text
    return text.replace(matcher, (whole, before, phrase) => before + PHRASES[lang][phrase])
  }

  return { lang, t, label, hint, phrases }
}

// Default value = English, so a component rendered outside the provider (a
// test, a story) still gets working text instead of crashing.
export const LanguageContext = createContext({ ...makeTranslator(DEFAULT_LANGUAGE), setLang: () => {} })

export const useI18n = () => useContext(LanguageContext)
