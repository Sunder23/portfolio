import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import uk from '@/locales/uk.json'
import { DEFAULT_LOCALE, getInitialLocale } from '@/lib/locale'

i18n.use(initReactI18next).init({
  resources: {
    uk: { translation: uk },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: getInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
})

export default i18n
