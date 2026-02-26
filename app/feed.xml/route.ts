import { getAllCreatures, getAllRegions, getCreatureImage } from "@/lib/folklore-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// 날짜 기반 해시 (daily-spotlight과 동일)
function dayHash(seed: number, idx: number): number {
  let h = Math.imul(seed, 0x9e3779b9) + Math.imul(idx, 0x9e37);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  return Math.abs((h >>> 16) ^ h);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const creatures = getAllCreatures();
  const regions = getAllRegions();
  const now = new Date();
  const daySeed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // 매일 다른 크리처 20개 선택 (지역별 균형 + 공포 높은 순)
  const dailyPicks: typeof creatures = [];
  const used = new Set<number>();

  for (let i = 0; i < 20; i++) {
    // 지역 라운드 로빈
    const region = regions[i % regions.length];
    const regionCreatures = creatures.filter((c) => c.region === region);
    if (regionCreatures.length === 0) continue;

    let idx = dayHash(daySeed, i) % regionCreatures.length;
    const globalIdx = creatures.indexOf(regionCreatures[idx]);

    if (!used.has(globalIdx)) {
      used.add(globalIdx);
      dailyPicks.push(regionCreatures[idx]);
    }
  }

  // 부족하면 공포 높은 순으로 채우기
  if (dailyPicks.length < 20) {
    const sorted = [...creatures].sort((a, b) => b.f - a.f);
    for (const c of sorted) {
      if (dailyPicks.length >= 20) break;
      const idx = creatures.indexOf(c);
      if (!used.has(idx)) {
        used.add(idx);
        dailyPicks.push(c);
      }
    }
  }

  const pubDate = now.toUTCString();

  const items = dailyPicks
    .map((c) => {
      const image = getCreatureImage(c.id);
      const imageTag = image
        ? `<enclosure url="${SITE_URL}${image}" type="image/webp" length="0" />`
        : "";
      const desc = c.d.length > 300 ? c.d.slice(0, 297) + "..." : c.d;

      return `    <item>
      <title>${escapeXml(c.ln || c.n)} — ${escapeXml(c.country)}</title>
      <link>${SITE_URL}/ko/creatures/${c.id}</link>
      <guid isPermaLink="true">${SITE_URL}/ko/creatures/${c.id}</guid>
      <description>${escapeXml(desc)}</description>
      <category>${escapeXml(c.region)}</category>
      <category>${escapeXml(c.t)}</category>
      <pubDate>${pubDate}</pubDate>
      ${imageTag}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>세계 요괴 도감 — Global Folklore Bestiary</title>
    <link>${SITE_URL}</link>
    <description>19개 대륙, 151개국의 전설 속 존재 ${creatures.length}종. 매일 새로운 크리처를 만나보세요.</description>
    <language>ko</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/og-default.png</url>
      <title>세계 요괴 도감</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
    },
  });
}
