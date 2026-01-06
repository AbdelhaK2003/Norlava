import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';

i18n
    .use(LanguageDetector) // Automatically detect user's language
    .use(initReactI18next) // Pass i18n to react-i18next
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr }
        },
        fallbackLng: 'en', // Default language if detection fails
        debug: false,

        interpolation: {
            escapeValue: false // React already escapes values
        },

        detection: {
            // Order of detection methods
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'] // Save user's language choice
        }
    });

export default i18n;
