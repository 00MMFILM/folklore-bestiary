#!/usr/bin/env node
// ============================================================
// IndexNow 제출 — Bing·네이버·Yandex 등 참여 검색엔진에 URL 변경 통지
// (계정 등록 불필요. 키 파일: public/<KEY>.txt)
//
// 사용법:
//   node scripts/submit-indexnow.mjs --all            # 라이브 sitemap의 전체 URL 제출 (1회성)
//   node scripts/submit-indexnow.mjs --from <파일>     # 크리처 id 목록(JSON 배열) → 4개 로케일 URL 제출
// ============================================================

import fs from 'fs';

const SITE = 'https://folklore-bestiary.vercel.app';
const HOST = 'folklore-bestiary.vercel.app';
const KEY = 'c4c1e787c5dbaba9bd922f346ed87dbb';
const LOCALES = ['ko', 'en', 'zh', 'ja'];

async function collectUrls() {
  if (process.argv.includes('--all')) {
    const res = await fetch(`${SITE}/sitemap.xml`);
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  }
  const idx = process.argv.indexOf('--from');
  if (idx !== -1 && process.argv[idx + 1]) {
    const file = process.argv[idx + 1];
    if (!fs.existsSync(file)) {
      console.log(`ℹ️ ${file} 없음 — 제출할 URL 없음`);
      return [];
    }
    const ids = JSON.parse(fs.readFileSync(file, 'utf8'));
    return ids.flatMap(id => LOCALES.map(loc => `${SITE}/${loc}/creatures/${id}`));
  }
  throw new Error('--all 또는 --from <file> 지정 필요');
}

const urls = await collectUrls();
if (urls.length === 0) process.exit(0);
console.log(`📤 IndexNow 제출: ${urls.length}개 URL`);

// 한 번에 최대 10,000개
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: batch,
    }),
  });
  console.log(`   배치 ${Math.floor(i / 10000) + 1}: HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✅' : await res.text()}`);
}
