import { useI18n } from './i18n'
import { LANGUAGES } from './strings'

// Two buttons rather than a dropdown: there are two languages, and a visitor
// who can't read the current one needs to recognise their own at a glance --
// so each button is labelled in its own language ("Español", never
// "Spanish") and marked with its own lang attribute for screen readers.
// `compact` shows EN / ES for the narrow mobile tab bar.
export default function LanguageToggle({ compact = false }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={`language-toggle${compact ? ' compact' : ''}`} role="group" aria-label={t('language.label')}>
      {Object.entries(LANGUAGES).map(([code, { name, short }]) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={lang === code ? 'active' : ''}
          aria-pressed={lang === code}
          aria-label={compact ? name : undefined}
          onClick={() => setLang(code)}
        >
          {compact ? short : name}
        </button>
      ))}
    </div>
  )
}
