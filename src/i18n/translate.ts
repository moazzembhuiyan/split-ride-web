import en from "./dictionaries/en.json";

export type Dictionary = Record<string, string>;

/**
 * Bundled so the first render (and any untranslated key) shows English text
 * instead of the raw key.
 */
export const FALLBACK: Dictionary = en;

let active: Dictionary = FALLBACK;

export function setActiveDictionary(dict: Dictionary): void {
  active = dict;
}

/** Fills {name} placeholders in a translated text. */
export function fillText(
  text: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Translation for code outside React (API and socket layers). */
export function translate(
  key: string,
  vars?: Record<string, string | number>,
): string {
  return fillText(active[key] ?? FALLBACK[key] ?? key, vars);
}
