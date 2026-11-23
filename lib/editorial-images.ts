export interface EditorialImage {
  src: string;
  smallSrc: string;
  shareSrc: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

function illustration(name: string, alt: string, caption: string): EditorialImage {
  const base = `/editorial-images/20261123/${name}`;
  return { src: `${base}.webp`, smallSrc: `${base}-small.webp`, shareSrc: `${base}-share.jpg`, width: 1536, height: 1024, alt, caption };
}

export const KOREAN_FOLKLORE_IMAGE = illustration(
  "korean-folklore-atlas",
  "달빛 아래 구미호와 강에서 솟아오른 이무기, 쇠를 먹는 불가사리를 함께 그린 그림",
  "AI로 그린 창작적 재해석. 각 존재의 모습은 전승과 판본에 따라 다릅니다.",
);

const kongkong = illustration(
  "kongkong-school-ghost",
  "비어 있는 밤의 교실과 멀리 작은 그림자가 드리운 복도",
  "콩콩귀신의 다가오는 소리를 상상한 AI 창작 그림. 실제 사건이나 특정 학교를 재현한 사진이 아닙니다.",
);

const biyiniao = illustration(
  "biyiniao-paired-birds",
  "A blue-green bird and a red bird, each with one outward wing, flying together above a swollen river",
  "An original AI illustration of the paired birds and flood omen. This is an artistic interpretation, not a historical image.",
);

export function getEditorialImage(id: string, locale: string): EditorialImage | null {
  if (id === "kr-kongkong-gwishin-hopping-ghost" && locale === "ko") return kongkong;
  if (id === "cn-biyiniao" && locale === "en") return biyiniao;
  return null;
}
