import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import kn from './locales/kn.json';
import hi from './locales/hi.json';

// Get saved language from localStorage or default to 'en'
const getSavedLanguage = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'en';
  }
  try {
    return localStorage.getItem('i18nextLng') || 'en';
  } catch {
    return 'en';
  }
};
const savedLanguage = getSavedLanguage();
const validLanguages = ['en', 'kn', 'hi'];
const initialLanguage = validLanguages.includes(savedLanguage) ? savedLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
});

export default i18n;
