// 크리처 심화 아티클 로더 (서버 전용)
// content/articles/{id}.json — scripts/generate-articles.mjs가 생성
import fs from "fs";
import path from "path";
import type { Locale } from "./i18n";

export interface ArticleSections {
  origin: string;
  legend: string;
  variants: string;
  culture: string;
}

export interface CreatureArticle {
  sourceTitle: string;
  sourceLang: string;
  sections: ArticleSections;
}

export function getCreatureArticle(id: string, locale: Locale): CreatureArticle | null {
  try {
    const p = path.join(process.cwd(), "content", "articles", `${id}.json`);
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const sections = raw.locales?.[locale];
    if (!sections) return null;
    return {
      sourceTitle: raw.sourceTitle,
      sourceLang: raw.sourceLang,
      sections,
    };
  } catch {
    return null;
  }
}
