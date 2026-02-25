// ─── Lightweight i18n (no external library) ───

export type Locale = "ko" | "en";
export const LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";

export function isValidLocale(v: string): v is Locale {
  return LOCALES.includes(v as Locale);
}

// ─── Dictionary type ───

interface Dictionary {
  // Navigation
  "nav.backToMap": string;
  "nav.viewOnMap": string;
  "nav.home": string;
  "nav.exploreMap": string;
  // Creature detail
  "creature.description": string;
  "creature.abilities": string;
  "creature.weaknesses": string;
  "creature.sources": string;
  "creature.genres": string;
  "creature.storyHooks": string;
  "creature.fear": string;
  "creature.notFound": string;
  "creature.notFoundDesc": string;
  // Content types
  "ct.myth": string;
  "ct.legend": string;
  "ct.folktale": string;
  // Region/Country list
  "list.creaturesInRegion": string;
  "list.creaturesInCountry": string;
  "list.creatureCount": string;
  "list.allRegions": string;
  "list.allCountries": string;
  "list.region": string;
  "list.country": string;
  "list.fearLevel": string;
  "list.type": string;
  // Meta
  "meta.siteName": string;
  "meta.siteDesc": string;
}

const ko: Dictionary = {
  "nav.backToMap": "← 월드맵으로 돌아가기",
  "nav.viewOnMap": "맵에서 보기",
  "nav.home": "홈",
  "nav.exploreMap": "🗺️ 월드맵에서 탐험하기",
  "creature.description": "설명",
  "creature.abilities": "능력",
  "creature.weaknesses": "약점",
  "creature.sources": "출처",
  "creature.genres": "장르",
  "creature.storyHooks": "스토리 훅",
  "creature.fear": "공포",
  "creature.notFound": "이 크리처를 찾을 수 없습니다",
  "creature.notFoundDesc": "The creature you are looking for does not exist in our bestiary.",
  "ct.myth": "신화 (Myth)",
  "ct.legend": "전설 (Legend)",
  "ct.folktale": "민담 (Folktale)",
  "list.creaturesInRegion": "의 전설 속 존재들",
  "list.creaturesInCountry": "의 전설 속 존재들",
  "list.creatureCount": "종",
  "list.allRegions": "모든 대륙",
  "list.allCountries": "모든 국가",
  "list.region": "대륙",
  "list.country": "국가",
  "list.fearLevel": "공포",
  "list.type": "유형",
  "meta.siteName": "세계 요괴 도감",
  "meta.siteDesc": "150개국 707종 전설 속 존재들의 인터랙티브 월드맵",
};

const en: Dictionary = {
  "nav.backToMap": "← Back to World Map",
  "nav.viewOnMap": "View on Map",
  "nav.home": "Home",
  "nav.exploreMap": "🗺️ Explore on World Map",
  "creature.description": "Description",
  "creature.abilities": "Abilities",
  "creature.weaknesses": "Weaknesses",
  "creature.sources": "Sources",
  "creature.genres": "Genres",
  "creature.storyHooks": "Story Hooks",
  "creature.fear": "Fear",
  "creature.notFound": "Creature Not Found",
  "creature.notFoundDesc": "The creature you are looking for does not exist in our bestiary.",
  "ct.myth": "Myth",
  "ct.legend": "Legend",
  "ct.folktale": "Folktale",
  "list.creaturesInRegion": " Creatures",
  "list.creaturesInCountry": " Creatures",
  "list.creatureCount": " creatures",
  "list.allRegions": "All Regions",
  "list.allCountries": "All Countries",
  "list.region": "Region",
  "list.country": "Country",
  "list.fearLevel": "Fear",
  "list.type": "Type",
  "meta.siteName": "Global Folklore Bestiary",
  "meta.siteDesc": "Interactive world map of 707 legendary creatures from 150 countries",
};

const dictionaries: Record<Locale, Dictionary> = { ko, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.ko;
}

export function getCtLabel(locale: Locale, ct: string): string {
  const d = getDictionary(locale);
  const key = `ct.${ct}` as keyof Dictionary;
  return d[key] || ct;
}
