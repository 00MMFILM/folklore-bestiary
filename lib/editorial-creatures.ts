import entry0 from "../content/editorial/en/bo-acalica.json";
import entry1 from "../content/editorial/en/br-boiuna.json";
import entry2 from "../content/editorial/en/cn-biyiniao.json";
import entry3 from "../content/editorial/en/cn-huoshu.json";
import entry4 from "../content/editorial/en/cn-qingniao.json";
import entry5 from "../content/editorial/en/cn-tenghuang.json";
import entry6 from "../content/editorial/en/cn-xiaotian-quan.json";
import entry7 from "../content/editorial/en/eg-apesh.json";
import entry8 from "../content/editorial/en/es-anguila-peluda.json";
import entry9 from "../content/editorial/en/kr-eoduksini.json";
import entry10 from "../content/editorial/en/kr-gumiho.json";
import entry11 from "../content/editorial/en/kr-hae-mo-su-of-buyeo.json";
import entry12 from "../content/editorial/en/no-hafgufa.json";
import entry13 from "../content/editorial/en/sct-baobh-shith.json";
import entry14 from "../content/editorial/en/wls-gwenddydd.json";
import entry15 from "../content/editorial/ko/es-geryon.json";
import entry16 from "../content/editorial/ko/ir-azi-dahaka.json";
import entry17 from "../content/editorial/ko/jp-ootakemaru.json";
import entry18 from "../content/editorial/ko/kr-eoduksini.json";
import entry19 from "../content/editorial/ko/kr-geuseundae.json";
import entry20 from "../content/editorial/ko/kr-imugi.json";
import entry21 from "../content/editorial/ko/kr-kongkong-gwishin-hopping-ghost.json";
import entry22 from "../content/editorial/ko/us-skinwalker.json";
import type { ArticleSections } from "./articles";
import type { Locale } from "./i18n";

export interface EditorialCreature {
  id: string;
  locale: string;
  title: string;
  tradition?: string;
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

// Separate from crawler output so imports cannot replace reviewed copy.
const entries: Record<string, EditorialCreature> = {
  "bo-acalica": entry0,
  "br-boiuna": entry1,
  "cn-biyiniao": entry2,
  "cn-huoshu": entry3,
  "cn-qingniao": entry4,
  "cn-tenghuang": entry5,
  "cn-xiaotian-quan": entry6,
  "eg-apesh": entry7,
  "es-anguila-peluda": entry8,
  "kr-eoduksini": entry9,
  "kr-gumiho": entry10,
  "kr-hae-mo-su-of-buyeo": entry11,
  "no-hafgufa": entry12,
  "sct-baobh-shith": entry13,
  "wls-gwenddydd": entry14,
};
const koreanEntries: Record<string, EditorialCreature> = {
  "es-geryon": entry15,
  "ir-azi-dahaka": entry16,
  "jp-ootakemaru": entry17,
  "kr-eoduksini": entry18,
  "kr-geuseundae": entry19,
  "kr-imugi": entry20,
  "kr-kongkong-gwishin-hopping-ghost": entry21,
  "us-skinwalker": entry22,
};

export function getEditorialCreature(id: string, locale: Locale): EditorialCreature | null {
  if (locale === "ko") return koreanEntries[id] ?? null;
  return locale === "en" ? entries[id] ?? null : null;
}
