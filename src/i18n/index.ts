import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translation files
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enStory from './locales/en/story.json';
import enKids from './locales/en/kids.json';
import enQuran from './locales/en/quran.json';
import enLive from './locales/en/live.json';
import enDedication from './locales/en/dedication.json';
import enLibrary from './locales/en/library.json';
import enIslamic from './locales/en/islamic.json';

// Import Egyptian Arabic translation files
import arEGCommon from './locales/ar-EG/common.json';
import arEGHome from './locales/ar-EG/home.json';
import arEGStory from './locales/ar-EG/story.json';
import arEGKids from './locales/ar-EG/kids.json';
import arEGQuran from './locales/ar-EG/quran.json';
import arEGLive from './locales/ar-EG/live.json';
import arEGDedication from './locales/ar-EG/dedication.json';
import arEGLibrary from './locales/ar-EG/library.json';
import arEGIslamic from './locales/ar-EG/islamic.json';

// localStorage keys
export const LANGUAGE_KEY = 'alayasoad_language';
export const LANGUAGE_SELECTED_KEY = 'alayasoad_language_selected';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    story: enStory,
    kids: enKids,
    quran: enQuran,
    live: enLive,
    dedication: enDedication,
    library: enLibrary,
    islamic: enIslamic,
  },
  'ar-EG': {
    common: arEGCommon,
    home: arEGHome,
    story: arEGStory,
    kids: arEGKids,
    quran: arEGQuran,
    live: arEGLive,
    dedication: arEGDedication,
    library: arEGLibrary,
    islamic: arEGIslamic,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'story', 'kids', 'quran', 'live', 'dedication', 'library', 'islamic'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  });

// Helper functions
export const isLanguageSelected = (): boolean => {
  return localStorage.getItem(LANGUAGE_SELECTED_KEY) === 'true';
};

export const markLanguageSelected = (): void => {
  localStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
};

export const getLanguageDirection = (): 'ltr' | 'rtl' => {
  return i18n.language === 'ar-EG' ? 'rtl' : 'ltr';
};

export const isArabic = (): boolean => {
  return i18n.language === 'ar-EG';
};

export const setLanguage = (lang: 'en' | 'ar-EG'): void => {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
