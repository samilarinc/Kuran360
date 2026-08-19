import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { commonResources } from '@msarinc/i18n-common';
import tr from './locales/tr.json';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
    resources: {
        tr: { translation: tr, common: commonResources.tr },
        en: { translation: en, common: commonResources.en },
    },
    lng: 'tr',
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
});

export default i18n;
