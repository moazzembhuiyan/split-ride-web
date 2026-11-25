"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LOCALES, type Locale, RTL_LOCALES } from "./locales";
import {
  type Dictionary,
  FALLBACK,
  fillText,
  setActiveDictionary,
} from "./translate";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;)\s*locale=([^;]+)/);
  const val = m?.[1] as Locale | undefined;
  return val && LOCALES.includes(val) ? val : null;
}

function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `locale=${locale};path=/;max-age=${365 * 24 * 3600};SameSite=Lax`;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.split("-")[0] as Locale;
  return LOCALES.includes(lang) ? lang : "en";
}

async function loadDictionary(locale: Locale): Promise<Dictionary> {
  const imports: Record<Locale, () => Promise<{ default: Dictionary }>> = {
    en: () => import("./dictionaries/en.json"),
    el: () => import("./dictionaries/el.json"),
    ru: () => import("./dictionaries/ru.json"),
    it: () => import("./dictionaries/it.json"),
    hi: () => import("./dictionaries/hi.json"),
    ur: () => import("./dictionaries/ur.json"),
    fr: () => import("./dictionaries/fr.json"),
    de: () => import("./dictionaries/de.json"),
    es: () => import("./dictionaries/es.json"),
    ar: () => import("./dictionaries/ar.json"),
    zh: () => import("./dictionaries/zh.json"),
    ja: () => import("./dictionaries/ja.json"),
  };
  try {
    const m = await imports[locale]();
    return m.default;
  } catch {
    const m = await import("./dictionaries/en.json");
    return m.default;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dictionary>(FALLBACK);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = readLocaleCookie() ?? detectBrowserLocale();
    setLocaleState(saved);
  }, []);

  useEffect(() => {
    let current = true;
    loadDictionary(locale).then((next) => {
      if (!current) return;
      setActiveDictionary(next);
      setDict(next);
    });
    writeLocaleCookie(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    return () => {
      current = false;
    };
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      fillText(dict[key] ?? FALLBACK[key] ?? key, vars),
    [dict],
  );
  const isRTL = RTL_LOCALES.includes(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
