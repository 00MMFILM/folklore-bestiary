import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { Locale } from "@/lib/i18n";

interface CreatureTranslation {
  d?: string;
  ab?: string[];
  wk?: string[];
  sh?: string[];
}

type TranslationMap = Record<string, CreatureTranslation>;

const cache: Partial<Record<Locale, TranslationMap>> = {};

export function getCreatureTranslations(locale: Locale): TranslationMap {
  if (locale === "en") return {}; // English is the source language for descriptions
  if (cache[locale]) return cache[locale]!;

  const filePath = resolve(process.cwd(), `public/i18n/creatures-${locale}.json`);
  if (!existsSync(filePath)) {
    cache[locale] = {};
    return {};
  }

  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    cache[locale] = data;
    return data;
  } catch {
    cache[locale] = {};
    return {};
  }
}

export function getCreatureTranslation(
  creatureId: string,
  locale: Locale
): CreatureTranslation | null {
  const translations = getCreatureTranslations(locale);
  return translations[creatureId] || null;
}
