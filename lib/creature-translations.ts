import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { Locale } from "@/lib/i18n";
import bulgasariReview from "../content/reviews/bulgasari-20261014.json";

interface CreatureTranslation {
  d?: string;
  ab?: string[];
  wk?: string[];
  sh?: string[];
}

type TranslationMap = Record<string, CreatureTranslation>;

const cache: Partial<Record<Locale, TranslationMap>> = {};

export function getCreatureTranslations(locale: Locale): TranslationMap {
  // English descriptions normally live in the canonical data, but its tags
  // are Korean. Reviewed entries provide explicit English tags and hooks.
  if (locale === "en") {
    return Object.fromEntries(bulgasariReview.ids.map(id => [id, bulgasariReview.translations.en]));
  }
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
