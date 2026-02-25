#!/usr/bin/env node
// ============================================================
// 전체 크리처 이미지 일괄 자동 생성 스크립트
// - 크리처 데이터에서 프롬프트 자동 생성
// - Standard 화질로 비용 절감 ($0.04/장)
// - 토큰 소진 시 자동 중단 & 진행분 저장
// ============================================================

import fs from 'fs';
import path from 'path';

// ─── .env.local 로드 ───
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('❌ OPENAI_API_KEY 없음'); process.exit(1); }

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'creatures');
const DELAY_MS = 2500;
const IMAGE_SIZE = '1024x1024';
const IMAGE_QUALITY = 'standard';

// ─── 지역 → 폴더 매핑 ───
const REGION_MAP = {
  "East Asia": "east-asia", "Southeast Asia": "east-asia",
  "Northern Europe": "europe", "Eastern Europe": "europe",
  "Southern Europe": "europe", "Western Europe": "europe",
  "North America": "americas", "Central America": "americas",
  "South America": "americas", "Caribbean": "americas",
  "East Africa": "africa", "West Africa": "africa",
  "Southern Africa": "africa", "North Africa": "africa", "Central Africa": "africa",
  "South Asia": "south-asia", "Central Asia": "south-asia", "West Asia": "south-asia",
  "Oceania": "oceania",
};

// ─── 크리처 데이터 파싱 ───
function loadCreatures() {
  const content = fs.readFileSync(path.join(process.cwd(), 'components', 'FolkloreMap.jsx'), 'utf8');
  const startIdx = content.indexOf('const FOLKLORE_DATA = ') + 'const FOLKLORE_DATA = '.length;
  let depth = 0, endIdx = startIdx;
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  const data = JSON.parse(content.substring(startIdx, endIdx));
  const creatures = [];
  for (const country of data) {
    for (const b of country.b) {
      creatures.push({ ...b, country: country.c, region: country.r, countryCode: country.i });
    }
  }
  return creatures;
}

// ─── 프롬프트 자동 생성 ───
function buildPrompt(c) {
  const visualHints = c.vk && c.vk.length > 0
    ? c.vk.slice(0, 4).join(', ')
    : '';

  const fearDesc = c.f >= 9 ? 'terrifying and menacing'
    : c.f >= 7 ? 'dark and ominous'
    : c.f >= 5 ? 'mysterious and supernatural'
    : 'ethereal and mystical';

  const nameClean = c.n.replace(/\s*\(.*?\)\s*/g, '').trim();

  let prompt = `${nameClean}, ${c.t} creature from ${c.country} folklore, ${fearDesc} atmosphere, `;

  if (visualHints) {
    prompt += `visual features: ${visualHints}, `;
  }

  // Use description but keep it short to avoid content policy issues
  const descShort = (c.d || '').replace(/blood|kill|murder|death|die|corpse|severed|flesh|devour|slaughter|gore|dismember|mutilat/gi, '')
    .substring(0, 120).trim();
  if (descShort) {
    prompt += `${descShort}, `;
  }

  prompt += `semi-realistic fantasy concept art style, dramatic cinematic lighting, `;
  prompt += `rich cultural details from ${c.country} tradition, `;
  prompt += `dark moody color palette, detailed illustration, no text, no watermarks`;

  return prompt;
}

// ─── DALL-E API 호출 ───
async function generateImage(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      response_format: 'url',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.data[0].url;
}

// ─── 이미지 다운로드 ───
async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(filepath, Buffer.from(await res.arrayBuffer()));
}

// ─── 이미지 맵 업데이트 ───
function updateImageMap(imageMap) {
  // 1. image-map.json 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'image-map.json'), JSON.stringify(imageMap, null, 2));

  // 2. FolkloreMap.jsx의 CREATURE_IMAGE_MAP 업데이트
  const fmPath = path.join(process.cwd(), 'components', 'FolkloreMap.jsx');
  let content = fs.readFileSync(fmPath, 'utf8');
  const mapStr = JSON.stringify(imageMap);
  content = content.replace(
    /const CREATURE_IMAGE_MAP = \{[^}]*\};/,
    `const CREATURE_IMAGE_MAP = ${mapStr};`
  );
  fs.writeFileSync(fmPath, content, 'utf8');
}

// ─── 메인 ───
async function main() {
  const creatures = loadCreatures();

  // 기존 이미지 맵 로드
  const mapPath = path.join(OUTPUT_DIR, 'image-map.json');
  const imageMap = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : {};

  // 이미 생성된 것 제외
  const todo = creatures.filter(c => {
    const shortId = c.id ? c.id.replace(/^[a-z]{2}-/, '') : '';
    return shortId && !imageMap[shortId];
  });

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🎨 전체 크리처 이미지 자동 생성                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  총 크리처: ${creatures.length}개`);
  console.log(`║  생성 완료: ${Object.keys(imageMap).length}개`);
  console.log(`║  남은 대상: ${todo.length}개`);
  console.log(`║  화질: ${IMAGE_QUALITY} | 비용: ~$${(todo.length * 0.04).toFixed(2)}`);
  console.log('║  토큰 소진 시 자동 중단 & 진행분 저장');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // 폴더 생성
  for (const folder of new Set(Object.values(REGION_MAP))) {
    const dir = path.join(OUTPUT_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  let success = 0, fail = 0, quotaHit = false;

  for (let i = 0; i < todo.length; i++) {
    const c = todo[i];
    const shortId = c.id.replace(/^[a-z]{2}-/, '');
    const folder = REGION_MAP[c.region] || 'other';
    const outPath = path.join(OUTPUT_DIR, folder, `${shortId}.webp`);

    // 파일이 이미 존재하면 스킵
    if (fs.existsSync(outPath)) {
      imageMap[shortId] = `/creatures/${folder}/${shortId}.webp`;
      success++;
      continue;
    }

    const nameClean = c.n.replace(/\s*\(.*?\)\s*/g, '').trim();
    process.stdout.write(`🎨 [${i + 1}/${todo.length}] ${nameClean} (${c.country})...`);

    try {
      const prompt = buildPrompt(c);
      const url = await generateImage(prompt);
      await downloadImage(url, outPath);
      imageMap[shortId] = `/creatures/${folder}/${shortId}.webp`;
      success++;
      console.log(` ✅`);

      // 50개마다 중간 저장
      if (success % 50 === 0) {
        updateImageMap(imageMap);
        console.log(`   💾 중간 저장 (${success}개 완료)`);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('insufficient_quota') || msg.includes('rate_limit') || msg.includes('billing')) {
        console.log(` ⛔ 토큰/요금 한도 도달!`);
        quotaHit = true;
        break;
      } else if (msg.includes('content_policy') || msg.includes('safety')) {
        console.log(` ⚠️ 정책 차단 — 스킵`);
        fail++;
      } else {
        console.log(` ❌ ${msg.substring(0, 80)}`);
        fail++;
      }
    }

    // Rate limit 대기
    if (i < todo.length - 1 && !quotaHit) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // 최종 저장
  updateImageMap(imageMap);

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  📊 최종 결과                                    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✅ 성공: ${success}개 (신규 생성)`);
  console.log(`║  ❌ 실패: ${fail}개`);
  console.log(`║  📁 총 이미지: ${Object.keys(imageMap).length}개 / ${creatures.length}개`);
  if (quotaHit) console.log('║  ⛔ 토큰 한도 도달로 중단됨');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('다음 단계: git add . && git commit && vercel --prod');
}

main().catch(console.error);
