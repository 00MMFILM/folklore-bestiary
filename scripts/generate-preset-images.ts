// ============================================================
// 📁 scripts/generate-preset-images.ts
// 프리셋 크리처 이미지 일괄 생성 스크립트
// 
// 실행: npx tsx scripts/generate-preset-images.ts
// 또는: node --loader ts-node/esm scripts/generate-preset-images.ts
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// ─── .env.local 로드 ───
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

// ─── 설정 ───
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'creatures');
const DELAY_MS = 3000; // DALL-E 3 rate limit: ~5 req/min → 3초 간격
const IMAGE_SIZE = '1024x1024' as const;
const IMAGE_QUALITY = 'hd' as const;

// ─── 스타일 베이스 ───
const STYLE_BASE = `semi-realistic webtoon concept art style, dramatic cinematic lighting, 
high detail professional illustration, dark atmospheric background, 
rich color palette, dynamic composition, 4K quality`;

// ─── 30개 프리셋 크리처 (간략 버전 - 전체 프롬프트는 creature-prompts.ts 참조) ───
const PRESETS = [
  // 동아시아
  { id: 'dokkaebi', region: 'east-asia', name: '도깨비' },
  { id: 'gumiho', region: 'east-asia', name: '구미호' },
  { id: 'tengu', region: 'east-asia', name: '텐구' },
  { id: 'jiangshi', region: 'east-asia', name: '강시' },
  { id: 'olgoi-khorkhoi', region: 'east-asia', name: '올고이코르코이' },
  // 유럽
  { id: 'banshee', region: 'europe', name: '밴시' },
  { id: 'kraken', region: 'europe', name: '크라켄' },
  { id: 'baba-yaga', region: 'europe', name: '바바야가' },
  { id: 'strigoi', region: 'europe', name: '스트리고이' },
  { id: 'draugr', region: 'europe', name: '드라우그' },
  // 아메리카
  { id: 'wendigo', region: 'americas', name: '웬디고' },
  { id: 'quetzalcoatl', region: 'americas', name: '케찰코아틀' },
  { id: 'chupacabra', region: 'americas', name: '추파카브라' },
  { id: 'mapinguari', region: 'americas', name: '마핑구아리' },
  { id: 'pishtaco', region: 'americas', name: '피시타코' },
  // 아프리카
  { id: 'adze', region: 'africa', name: '아제' },
  { id: 'tokoloshe', region: 'africa', name: '토콜로셰' },
  { id: 'ninki-nanka', region: 'africa', name: '닌키난카' },
  { id: 'popobawa', region: 'africa', name: '포포바와' },
  { id: 'impundulu', region: 'africa', name: '임푼둘루' },
  // 남아시아
  { id: 'rakshasa', region: 'south-asia', name: '락샤사' },
  { id: 'vetala', region: 'south-asia', name: '베탈라' },
  { id: 'yaksha', region: 'south-asia', name: '야차' },
  { id: 'bhoot', region: 'south-asia', name: '부트' },
  { id: 'mahakala', region: 'south-asia', name: '마하칼라' },
  // 오세아니아
  { id: 'taniwha', region: 'oceania', name: '타니화' },
  { id: 'bunyip', region: 'oceania', name: '버닙' },
  { id: 'adaro', region: 'oceania', name: '아다로' },
  { id: 'tipua', region: 'oceania', name: '티푸아' },
  { id: 'yowie', region: 'oceania', name: '요위' },
];

// ─── 유틸리티 ───
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── DALL-E 3 이미지 생성 ───
async function generateImage(prompt: string): Promise<{ url: string; revisedPrompt: string }> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `${prompt}, ${STYLE_BASE}`,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      style: 'vivid',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`DALL-E API Error: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return {
    url: data.data[0].url,
    revisedPrompt: data.data[0].revised_prompt,
  };
}

// ─── 이미지 다운로드 및 저장 ───
async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

// ─── 메인 실행 ───
async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 환경변수를 설정해주세요.');
    console.error('   export OPENAI_API_KEY="sk-..."');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎨 GFS 크리처 이미지 일괄 생성 시작     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  대상: ${PRESETS.length}개 프리셋 크리처`);
  console.log(`║  크기: ${IMAGE_SIZE} | 품질: ${IMAGE_QUALITY}`);
  console.log(`║  예상 비용: ~$${(PRESETS.length * 0.08).toFixed(2)} (HD)`);
  console.log(`║  예상 시간: ~${Math.ceil(PRESETS.length * DELAY_MS / 60000)}분`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // creature-prompts.ts에서 프롬프트 동적 로딩
  let CREATURE_PROMPTS: any[];
  try {
    const module = await import('../lib/creature-prompts');
    CREATURE_PROMPTS = module.CREATURE_PROMPTS;
  } catch {
    console.error('❌ lib/creature-prompts.ts를 찾을 수 없습니다.');
    console.error('   파일이 프로젝트 루트/lib/ 에 있는지 확인해주세요.');
    process.exit(1);
  }

  // 출력 디렉토리 준비
  ensureDir(OUTPUT_DIR);
  for (const region of ['east-asia', 'europe', 'americas', 'africa', 'south-asia', 'oceania']) {
    ensureDir(path.join(OUTPUT_DIR, region));
  }

  // 결과 추적
  const results: Array<{ id: string; name: string; status: string; path?: string; error?: string }> = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < PRESETS.length; i++) {
    const preset = PRESETS[i];
    const creatureData = CREATURE_PROMPTS.find((c: any) => c.id === preset.id);
    
    if (!creatureData) {
      console.log(`⚠️  [${i + 1}/${PRESETS.length}] ${preset.name} — 프롬프트 데이터 없음, 스킵`);
      results.push({ id: preset.id, name: preset.name, status: 'skipped', error: 'No prompt data' });
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, preset.region, `${preset.id}.webp`);
    
    // 이미 생성된 이미지가 있으면 스킵
    if (fs.existsSync(outputPath)) {
      console.log(`✅ [${i + 1}/${PRESETS.length}] ${preset.name} — 이미 존재, 스킵`);
      results.push({ id: preset.id, name: preset.name, status: 'exists', path: outputPath });
      successCount++;
      continue;
    }

    try {
      process.stdout.write(`🎨 [${i + 1}/${PRESETS.length}] ${preset.name} (${creatureData.nameEn}) 생성 중...`);
      
      const { url, revisedPrompt } = await generateImage(creatureData.prompt);
      await downloadImage(url, outputPath);
      
      console.log(` ✅ 완료`);
      results.push({ id: preset.id, name: preset.name, status: 'success', path: outputPath });
      successCount++;

      // 수정된 프롬프트 로깅 (디버깅용)
      const logPath = path.join(OUTPUT_DIR, preset.region, `${preset.id}.prompt.txt`);
      fs.writeFileSync(logPath, `Original: ${creatureData.prompt}\n\nRevised: ${revisedPrompt}`);

    } catch (err) {
      console.log(` ❌ 실패: ${err}`);
      results.push({ id: preset.id, name: preset.name, status: 'failed', error: String(err) });
      failCount++;
    }

    // Rate limit 대기
    if (i < PRESETS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ─── 결과 리포트 ───
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  📊 생성 결과 리포트                      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  ✅ 성공: ${successCount}개`);
  console.log(`║  ❌ 실패: ${failCount}개`);
  console.log(`║  📁 저장 위치: ${OUTPUT_DIR}`);
  console.log('╚══════════════════════════════════════════╝');

  // 결과 JSON 저장
  const reportPath = path.join(OUTPUT_DIR, 'generation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: PRESETS.length,
    success: successCount,
    failed: failCount,
    results,
  }, null, 2));

  console.log(`\n📄 상세 리포트: ${reportPath}`);

  // 이미지 매핑 파일 생성 (프론트엔드에서 사용)
  const imageMap: Record<string, string> = {};
  for (const r of results) {
    if (r.status === 'success' || r.status === 'exists') {
      const preset = PRESETS.find(p => p.id === r.id)!;
      imageMap[r.id] = `/creatures/${preset.region}/${r.id}.webp`;
    }
  }

  const mapPath = path.join(OUTPUT_DIR, 'image-map.json');
  fs.writeFileSync(mapPath, JSON.stringify(imageMap, null, 2));
  console.log(`🗺️  이미지 맵: ${mapPath}`);
}

main().catch(console.error);
