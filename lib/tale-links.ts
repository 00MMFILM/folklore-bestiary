// 같은 설화 등장 존재 상호링크 로더 (서버 전용)
// content/tale-links.json — scripts/build-tale-links.mjs가 생성
import taleLinks from "@/content/tale-links.json";

export interface TaleLink {
  id: string;
  n: string;
}

const MAP = taleLinks as Record<string, TaleLink[]>;

export function getTaleLinks(id: string): TaleLink[] {
  return MAP[id] || [];
}
