// Job titles on the map are in English (they are shown as the employer
// posted them), so a search typed in Spanish would otherwise find nothing:
// "soldador" appears in no posting, "Welder" does. This maps common Spanish
// job words to the English fragments that appear in titles. The search looks
// for what was typed AND for these, in either language setting (see
// buildSearchTest at the bottom).
//
// Keys are lower-case with no accents (the search strips accents before it
// looks here), and are matched by their beginning in both directions, so
// "solda", "soldador" and "soldadores" all reach the same entry. To add a
// word, add a line; the English side should be a fragment, e.g. 'weld'
// catches Welder, Welding and Weld Technician.
export const SEARCH_SYNONYMS = {
  soldador: ['weld'],
  soldadura: ['weld'],
  chofer: ['driver', 'cdl'],
  conductor: ['driver', 'cdl'],
  camionero: ['truck', 'cdl', 'driver'],
  camion: ['truck', 'cdl'],
  trailero: ['truck', 'cdl', 'driver'],
  mecanico: ['mechanic', 'technician'],
  tecnico: ['technician', 'tech'],
  electricista: ['electric'],
  plomero: ['plumb', 'pipefitter'],
  carpintero: ['carpent'],
  albanil: ['mason', 'concrete', 'laborer'],
  pintor: ['paint'],
  obrero: ['laborer', 'labourer', 'general labor'],
  ayudante: ['helper', 'assistant', 'laborer'],
  jornalero: ['laborer', 'general labor'],
  construccion: ['construction'],
  operador: ['operator'],
  montacargas: ['forklift', 'material handler'],
  almacen: ['warehouse', 'material handler'],
  bodega: ['warehouse'],
  empacador: ['packer', 'packag'],
  maquinista: ['machinist', 'machine operator', 'cnc'],
  produccion: ['production'],
  ensamblador: ['assembl'],
  mantenimiento: ['maintenance'],
  limpieza: ['custodian', 'janitor', 'cleaner', 'housekeep', 'sanitation'],
  conserje: ['custodian', 'janitor'],
  seguridad: ['security', 'safety'],
  guardia: ['security', 'guard'],
  cocinero: ['cook', 'culinary', 'kitchen'],
  cocina: ['cook', 'kitchen', 'culinary'],
  cajero: ['cashier'],
  ventas: ['sales'],
  enfermera: ['nurse', 'rn', 'lpn'],
  enfermero: ['nurse', 'rn', 'lpn'],
  enfermeria: ['nurs'],
  medico: ['medical', 'physician'],
  maestro: ['teacher', 'instructor'],
  maestra: ['teacher', 'instructor'],
  profesor: ['teacher', 'instructor', 'professor'],
  ingeniero: ['engineer'],
  supervisor: ['supervisor', 'foreman'],
  gerente: ['manager'],
  contador: ['account'],
  oficina: ['office', 'administrative', 'clerk'],
  recepcionista: ['reception'],
  secretaria: ['administrative', 'secretary', 'clerk'],
  bombero: ['firefighter', 'fire fighter'],
  policia: ['police'],
  jardinero: ['landscap', 'grounds'],
  aprendiz: ['apprentice', 'trainee'],
  pasante: ['intern', 'co-op'],
  practicante: ['intern', 'co-op'],
  refineria: ['refinery', 'refining'],
  acero: ['steel'],
  puerto: ['port', 'terminal', 'marine'],
}

// Minimum typed length before a partial word is allowed to match the START
// of a key ("sold" -> soldador). Shorter fragments match too many entries.
const PREFIX_MIN_CHARS = 4

// 'soldadores' -> ['weld']. Empty when the term matches no entry.
function synonymsFor(term) {
  const found = new Set()
  for (const [spanish, english] of Object.entries(SEARCH_SYNONYMS)) {
    const typedIsStartOfWord = term.length >= PREFIX_MIN_CHARS && spanish.startsWith(term)
    const typedIsWordPlusEnding = term.startsWith(spanish) // plurals: soldadores, choferes
    if (typedIsStartOfWord || typedIsWordPlusEnding) english.forEach(e => found.add(e))
  }
  return [...found]
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Returns a function that says whether a piece of (already lower-cased,
// accent-stripped) text matches the search. What the visitor typed matches
// anywhere in the text. The English synonyms only match at the START of a
// word -- they are short fragments, and "port" should find "Port Operator"
// but not "Transportation".
export function buildSearchTest(term) {
  const synonyms = synonymsFor(term)
  const synonymPattern = synonyms.length
    ? new RegExp(`\\b(?:${synonyms.map(escapeRegExp).join('|')})`)
    : null
  return (text) => text.includes(term) || (synonymPattern !== null && synonymPattern.test(text))
}
