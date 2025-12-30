import i18next from 'i18next';
import { getLanguage } from './locale.js';
import en from '../locales/en.js';
import fr from '../locales/fr.js';

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized) return;

  const language = getLanguage();

  await i18next.init({
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'translation',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  initialized = true;
}

export function t(key: string, options?: Record<string, unknown>): string {
  if (!initialized) {
    return key;
  }
  return i18next.t(key, options);
}

export function changeLanguage(lang: string): void {
  i18next.changeLanguage(lang);
}

export { i18next };
