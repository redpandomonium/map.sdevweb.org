import { useEffect, useState } from 'react'
import { useI18n } from './i18n'

// The Google Form's "Send" -> link URL, in its full form:
//   https://docs.google.com/forms/d/e/<long id>/viewform
// (not the forms.gle short link -- that one redirects and can't be embedded).
// Responses go wherever the form is set to send them (a linked Google Sheet).
// While this is empty the whole feedback UI renders nothing, so the live site
// never shows a button that opens onto a broken form.
export const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdBPjev3aBqlImkuusR67fGTuLN-yGOVBIaNi9IJv2yuZ0img/viewform'

// The Spanish copy of the same form. Google Forms has no per-visitor language
// switch, so a Spanish form is a second form (Form menu -> Make a copy, then
// translate the questions). Paste its /viewform URL here. While this is empty,
// Spanish-language visitors get the English form above rather than no form.
export const FEEDBACK_FORM_URL_ES = ''

const FORM_URLS = { en: FEEDBACK_FORM_URL, es: FEEDBACK_FORM_URL_ES }

function embedUrl(url) {
  try {
    const u = new URL(url)
    u.searchParams.set('embedded', 'true')
    return u.toString()
  } catch {
    return url
  }
}

// A button (in the sidebar header) that opens the form in an overlay rather
// than navigating away, so a visitor who was mid-browse doesn't lose their
// filters and place in the list.
export default function FeedbackButton() {
  const { t, lang } = useI18n()
  const formUrl = FORM_URLS[lang] || FEEDBACK_FORM_URL
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!formUrl) return null

  return (
    <>
      <button type="button" className="feedback-button" onClick={() => setOpen(true)}>
        {t('feedback.button')}
      </button>
      {open && (
        <div className="feedback-overlay" onClick={() => setOpen(false)}>
          <div
            className="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t('feedback.title')}
            onClick={e => e.stopPropagation()}
          >
            <div className="feedback-dialog-header">
              <h2>{t('feedback.title')}</h2>
              <a href={formUrl} target="_blank" rel="noopener noreferrer" className="feedback-open-tab">
                {t('feedback.openTab')}&nbsp;&#8599;
              </a>
              <button type="button" className="feedback-close" onClick={() => setOpen(false)} aria-label={t('feedback.close')}>
                &times;
              </button>
            </div>
            <iframe src={embedUrl(formUrl)} title={t('feedback.frameTitle')} className="feedback-frame">
              Loading&hellip;
            </iframe>
          </div>
        </div>
      )}
    </>
  )
}
