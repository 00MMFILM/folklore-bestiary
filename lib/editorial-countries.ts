import korea from "../content/editorial/countries/ko-kr.json";
import jamaica from "../content/editorial/countries/en-jm.json";
export interface EditorialCountry {
  title: string; metaDescription: string; intro: string;
  sections: { title: string; text: string }[];
  picks: { id: string; label: string; reason: string }[];
  questions: { question: string; answer: string }[];
  sources: { title: string; url: string }[];
  reviewedAt: string; listTitle: string; listedIds?: string[];
}
export function getEditorialCountry(code: string, locale: string): EditorialCountry | null {
  if (locale === "ko" && code.toLowerCase() === "kr") return korea;
  if (locale === "en" && code.toLowerCase() === "jm") return jamaica;
  return null;
}
