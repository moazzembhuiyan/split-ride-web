export const LOCALES = [
  "en",
  "el",
  "ru",
  "it",
  "hi",
  "ur",
  "fr",
  "de",
  "es",
  "ar",
  "zh",
  "ja",
] as const;

export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: Locale[] = ["ar", "ur"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  el: "Greek",
  ru: "Russian",
  it: "Italian",
  hi: "Hindi",
  ur: "Urdu",
  fr: "French",
  de: "German",
  es: "Spanish",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
};
