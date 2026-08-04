import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import ar from './locales/ar/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: localStorage.getItem('tahfeez-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

const lang = i18n.language;
document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

export default i18n;
