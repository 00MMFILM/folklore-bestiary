import tenghuang from "../content/editorial/en/cn-tenghuang.json";
import boiuna from "../content/editorial/en/br-boiuna.json";
import biyiniao from "../content/editorial/en/cn-biyiniao.json";
import apesh from "../content/editorial/en/eg-apesh.json";
import gwenddydd from "../content/editorial/en/wls-gwenddydd.json";
import xiaotianQuan from "../content/editorial/en/cn-xiaotian-quan.json";
import imugi from "../content/editorial/ko/kr-imugi.json";
import eoduksini from "../content/editorial/ko/kr-eoduksini.json";
import geuseundae from "../content/editorial/ko/kr-geuseundae.json";
import type { ArticleSections } from "./articles";
import type { Locale } from "./i18n";

export interface EditorialCreature {
  id: string;
  locale: string;
  title: string;
  metaDescription: string;
  description: string;
  displayType: string;
  abilities: string[];
  weaknesses: string[];
  storyHooks: string[];
  sections: ArticleSections;
  sources: { title: string; url: string }[];
  researchNote: string;
  reviewedAt: string;
  relatedIds: string[];
  questions?: { question: string; answer: string }[];
}

// Kept apart from crawler output so scheduled imports cannot replace reviewed copy.
// Static imports include reviewed entries in the production server bundle.
const entries: Record<string, EditorialCreature> = {
  "cn-tenghuang": tenghuang,
  "br-boiuna": boiuna,
  "cn-biyiniao": biyiniao,
  "eg-apesh": apesh,
  "wls-gwenddydd": gwenddydd,
  "cn-xiaotian-quan": xiaotianQuan,
};

const koreanEntries: Record<string, EditorialCreature> = {
  "kr-imugi": imugi,
  "kr-eoduksini": eoduksini,
  "kr-geuseundae": geuseundae,
};

export function getEditorialCreature(id: string, locale: Locale): EditorialCreature | null {
  if (locale === "ko") return koreanEntries[id] ?? null;
  return locale === "en" ? entries[id] ?? null : null;
}
