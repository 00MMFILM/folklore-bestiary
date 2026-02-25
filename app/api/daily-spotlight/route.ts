// ============================================================
// 📁 app/api/daily-spotlight/route.ts
// 매일 새로운 민담/신화 콘텐츠를 외부에서 발굴하는 API
// - Wikipedia API (무료) → 신화/전설 생물 기사 발굴
// - Google News RSS (무료) → 민담/신화 관련 뉴스
// - 24시간 Vercel Edge 캐시
// ============================================================

import { NextResponse } from 'next/server';

// ─── 날짜 기반 해시 (매일 같은 결과, 다음날 자동 변경) ───
function dayHash(seed: number, idx: number): number {
  let h = Math.imul(seed, 0x9E3779B9) + Math.imul(idx, 0x9E37);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  return Math.abs((h >>> 16) ^ h);
}

// ─── Wikipedia 카테고리 풀 ───
const WIKI_CATEGORIES = [
  // 한국어 위키
  { lang: 'ko', cat: '분류:요괴', label: '요괴' },
  { lang: 'ko', cat: '분류:신화의_생물', label: '신화의 생물' },
  { lang: 'ko', cat: '분류:전설의_생물', label: '전설의 생물' },
  { lang: 'ko', cat: '분류:귀신', label: '귀신' },
  { lang: 'ko', cat: '분류:악마', label: '악마' },
  { lang: 'ko', cat: '분류:용', label: '용' },
  { lang: 'ko', cat: '분류:뱀파이어', label: '뱀파이어' },
  { lang: 'ko', cat: '분류:민담', label: '민담' },
  // 영어 위키 (더 방대한 콘텐츠)
  { lang: 'en', cat: 'Category:Legendary_creatures_by_country', label: '나라별 전설 생물' },
  { lang: 'en', cat: 'Category:Mythological_creatures', label: '신화 속 생물' },
  { lang: 'en', cat: 'Category:Demons_in_mythology', label: '신화 속 악마' },
  { lang: 'en', cat: 'Category:Shapeshifters', label: '변신 존재' },
  { lang: 'en', cat: 'Category:Undead', label: '언데드' },
  { lang: 'en', cat: 'Category:Sea_monsters', label: '바다 괴물' },
  { lang: 'en', cat: 'Category:Witchcraft', label: '마법과 주술' },
  { lang: 'en', cat: 'Category:Ghosts', label: '유령' },
  { lang: 'en', cat: 'Category:Folklore_characters', label: '민담 캐릭터' },
];

// ─── Wikipedia API: 카테고리에서 기사 목록 가져오기 ───
async function fetchCategoryMembers(lang: string, cat: string, limit = 200): Promise<Array<{title: string, pageid: number}>> {
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}` +
    `&cmlimit=${limit}&cmtype=page&format=json&origin=*`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return data.query?.categorymembers || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Wikipedia API: 기사 상세 (요약 + 썸네일) ───
async function fetchArticleDetails(lang: string, titles: string[]): Promise<Array<{
  title: string; extract: string; thumbnail: string | null; url: string; lang: string;
}>> {
  if (titles.length === 0) return [];
  const joined = titles.join('|');
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=query&prop=extracts|pageimages&exintro&explaintext&exsentences=4` +
    `&pithumbsize=400&titles=${encodeURIComponent(joined)}&format=json&origin=*`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return Object.values(data.query?.pages || {})
      .filter((p: any) => p.pageid && p.extract)
      .map((p: any) => ({
        title: p.title,
        extract: (p.extract || '').substring(0, 300),
        thumbnail: p.thumbnail?.source || null,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        lang,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Google News RSS 파싱 ───
async function fetchFolkloreNews(): Promise<Array<{
  title: string; link: string; pubDate: string; source: string;
}>> {
  const queries = [
    'folklore+mythology+legend',
    '민담+전설+신화',
    'mythological+creature+discovery',
  ];
  const query = queries[new Date().getDate() % queries.length];
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(rssUrl, { signal: controller.signal });
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, 6).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const source = (item.match(/<source.*?>(.*?)<\/source>/))?.[1] || '';
      return { title, link, pubDate, source };
    }).filter(n => n.title && n.link);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── 메인 핸들러 ───
export async function GET() {
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // 오늘의 카테고리 4개 선택 (한국어 2 + 영어 2)
  const koCategories = WIKI_CATEGORIES.filter(c => c.lang === 'ko');
  const enCategories = WIKI_CATEGORIES.filter(c => c.lang === 'en');

  const pickedKo = [
    koCategories[dayHash(daySeed, 0) % koCategories.length],
    koCategories[dayHash(daySeed, 1) % koCategories.length],
  ];
  const pickedEn = [
    enCategories[dayHash(daySeed, 2) % enCategories.length],
    enCategories[dayHash(daySeed, 3) % enCategories.length],
  ];
  const pickedCats = [...pickedKo, ...pickedEn];

  // 각 카테고리에서 기사 2개씩 발굴
  const discoveryPromises = pickedCats.map(async (cat, ci) => {
    const members = await fetchCategoryMembers(cat.lang, cat.cat);
    if (members.length === 0) return [];

    // 날짜 기반으로 결정적 선택
    const picks: string[] = [];
    const used = new Set<number>();
    for (let j = 0; j < 2; j++) {
      let idx = dayHash(daySeed, ci * 100 + j) % members.length;
      while (used.has(idx) && used.size < members.length) {
        idx = (idx + 1) % members.length;
      }
      used.add(idx);
      picks.push(members[idx].title);
    }

    const articles = await fetchArticleDetails(cat.lang, picks);
    return articles.map(a => ({ ...a, category: cat.label }));
  });

  // 뉴스도 병렬 fetch
  const [discoveryResults, news] = await Promise.all([
    Promise.allSettled(discoveryPromises),
    fetchFolkloreNews(),
  ]);

  const discoveries = discoveryResults
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(d => d.extract && d.extract.length > 30) // 너무 짧은 기사 제외
    .slice(0, 8);

  return NextResponse.json({
    date: today.toISOString().split('T')[0],
    discoveries,
    news: news.slice(0, 4),
    categories: pickedCats.map(c => c.label),
  }, {
    headers: {
      // 24시간 Vercel Edge 캐시 + 1시간 stale-while-revalidate
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
