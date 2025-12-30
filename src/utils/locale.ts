import { config } from './config.js';

const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function detectSystemLanguage(): SupportedLanguage {
  const envLang =
    process.env.LANG ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANGUAGE ||
    '';

  const langCode = envLang.toLowerCase().split(/[_.-]/)[0];

  if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
    return langCode as SupportedLanguage;
  }

  return 'en';
}

export function getLanguage(): SupportedLanguage {
  const configured = config.getLanguage();

  if (SUPPORTED_LANGUAGES.includes(configured as SupportedLanguage)) {
    return configured as SupportedLanguage;
  }

  return detectSystemLanguage();
}

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

export function getSupportedLanguages(): readonly string[] {
  return SUPPORTED_LANGUAGES;
}
