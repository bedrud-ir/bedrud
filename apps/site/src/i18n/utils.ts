import ar from "./locales/ar";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fa from "./locales/fa";
import fr from "./locales/fr";
import ja from "./locales/ja";
import ru from "./locales/ru";
import tr from "./locales/tr";
import zh from "./locales/zh";

const translations: Record<string, Record<string, unknown>> = {
  en,
  de,
  fr,
  es,
  zh,
  ja,
  tr,
  fa,
  ar,
  ru,
};

export type Locale = keyof typeof translations;
export const supportedLocales: Locale[] = [
  "en",
  "de",
  "fr",
  "es",
  "zh",
  "ja",
  "tr",
  "fa",
  "ar",
  "ru",
];
export const rtlLocales = new Set(["fa", "ar"]);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export function t(locale: Locale, key: string): string {
  const value = getNestedValue(translations[locale], key);
  if (value !== key) return value;
  return getNestedValue(translations.en, key);
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}

export function isValidLocale(l: string): l is Locale {
  return supportedLocales.includes(l as Locale);
}
