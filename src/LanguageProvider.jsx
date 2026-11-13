import { useEffect, useMemo, useState } from 'react'
import { LanguageContext, makeTranslator, readSavedLanguage, saveLanguage } from './i18n'

// Holds the current language for the whole app. Wraps <App /> in main.jsx;
// any component reads it with useI18n().
export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readSavedLanguage)

  const value = useMemo(() => ({
    ...makeTranslator(lang),
    setLang: (next) => { saveLanguage(next); setLangState(next) },
  }), [lang])

  // Keeps the page itself in step with the toggle: <html lang> is what screen
  // readers use to pick a voice and what stops the browser offering to
  // "translate this page" on top of text that is already Spanish.
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = value.t('page.title')
  }, [lang, value])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
