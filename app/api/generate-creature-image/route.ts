// ============================================================
// 📁 app/api/generate-creature-image/route.ts
// GFS DALL-E 3 크리처 이미지 생성 API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// ─── 스타일 베이스 프롬프트 ───
const STYLE_BASE = `semi-realistic webtoon concept art style, dramatic cinematic lighting, 
high detail professional illustration, dark atmospheric background, 
rich color palette, dynamic composition, trending on artstation, 4K quality`;

// ─── 문화권별 스타일 레이어 ───
const CULTURAL_STYLE: Record<string, string> = {
  'Korea': 'incorporating subtle Korean traditional art (minhwa) influences, hanbok textile patterns',
  'Japan': 'with ukiyo-e inspired composition, Japanese ink wash atmosphere',
  'China': 'with Chinese ink painting atmosphere, traditional motifs',
  'Mongolia': 'vast steppe and desert atmosphere, nomadic cultural elements',
  'Vietnam': 'Southeast Asian tropical atmosphere, lacquer art color influences',
  'Ireland': 'Celtic art patterns, misty green Irish landscape atmosphere',
  'Norway': 'Norse runic decorative elements, fjord and northern landscape',
  'Russia': 'Slavic folk art patterns, birch forest atmosphere',
  'Romania': 'Gothic Transylvanian atmosphere, medieval Eastern European aesthetics',
  'Iceland': 'volcanic and glacial landscape, Norse saga atmosphere',
  'Greece': 'ancient Hellenic architectural elements, Mediterranean light',
  'Mexico': 'Mesoamerican art patterns, Aztec/Maya architectural motifs',
  'Brazil': 'lush Amazon rainforest atmosphere, vibrant tropical colors',
  'Peru': 'Andean mountain landscape, Incan architectural elements',
  'Canada': 'boreal forest atmosphere, First Nations art influences',
  'Puerto Rico': 'Caribbean tropical night atmosphere',
  'Ghana': 'West African Kente cloth patterns, savanna atmosphere',
  'South Africa': 'Southern African landscape, traditional Zulu art elements',
  'Tanzania': 'East African Swahili coastal architecture',
  'Gambia': 'West African wetland mangrove atmosphere',
  'India': 'Dravidian temple architecture, rich Indian textile patterns',
  'Nepal': 'Himalayan monastery atmosphere, Buddhist thangka art style',
  'Sri Lanka': 'tropical Buddhist temple surroundings, Sinhalese art',
  'Bangladesh': 'Bengal delta landscape, South Asian folk art',
  'New Zealand': 'Maori carving patterns, native bush atmosphere',
  'Australia': 'Australian outback, Aboriginal dot painting influences',
  'Solomon Islands': 'Melanesian oceanic art, tropical Pacific atmosphere',
};

// ─── 공포등급별 분위기 레이어 ───
function getFearAtmosphere(fearLevel: number): string {
  if (fearLevel >= 9) return 'extremely dark and terrifying atmosphere, horror genre lighting, sense of overwhelming dread';
  if (fearLevel >= 7) return 'dark and ominous atmosphere, unsettling mood, dramatic shadows';
  if (fearLevel >= 5) return 'mysterious and slightly menacing atmosphere, twilight ambiance';
  return 'mystical and enchanting atmosphere, magical ambient glow';
}

// ─── 전체 프롬프트 빌더 ───
function buildPrompt(
  creaturePrompt: string,
  country: string,
  fearLevel: number
): string {
  const cultural = CULTURAL_STYLE[country] || '';
  const fear = getFearAtmosphere(fearLevel);
  
  return [
    creaturePrompt,
    cultural,
    fear,
    STYLE_BASE
  ].filter(Boolean).join(', ');
}

// ─── API 핸들러 ───
export async function POST(req: NextRequest) {
  try {
    const { creatureId, prompt, country, fearLevel, size = '1024x1024' } = await req.json();

    if (!creatureId || !prompt) {
      return NextResponse.json(
        { error: 'creatureId and prompt are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // 프롬프트 조합
    const fullPrompt = buildPrompt(prompt, country || '', fearLevel || 5);

    // DALL-E 3 API 호출
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: size,       // "1024x1024" | "1792x1024" | "1024x1792"
        quality: 'hd',    // "standard" | "hd"
        style: 'vivid',   // "vivid" | "natural"
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[DALL-E Error]', err);
      return NextResponse.json(
        { error: 'Image generation failed', details: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    const revisedPrompt = data.data[0].revised_prompt;

    // ─── 이미지 캐싱 (Vercel Blob 사용 시) ───
    // Vercel Blob이 설정되어 있으면 영구 캐싱
    let cachedUrl = imageUrl;
    
    try {
      // Vercel Blob 사용 가능 시
      // import { put } from '@vercel/blob';
      // const imageResponse = await fetch(imageUrl);
      // const blob = await imageResponse.blob();
      // const { url } = await put(
      //   `creatures/${creatureId}.webp`,
      //   blob,
      //   { access: 'public', contentType: 'image/webp' }
      // );
      // cachedUrl = url;
      
      // 또는 public/creatures/ 폴더에 저장하는 방식도 가능
      console.log(`[GFS] Image generated for ${creatureId}`);
    } catch (cacheError) {
      console.warn('[GFS] Cache failed, using temporary URL:', cacheError);
    }

    return NextResponse.json({
      creatureId,
      imageUrl: cachedUrl,
      revisedPrompt,
      cached: cachedUrl !== imageUrl,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[GFS] Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── 생성 상태 확인 (GET): 로컬 파일 기반 ───
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatureId = searchParams.get('creatureId');

  if (!creatureId) {
    return NextResponse.json({ error: 'creatureId is required' }, { status: 400 });
  }

  const fs = await import('fs');
  const path = await import('path');
  const imgPath = path.join(process.cwd(), 'public', 'creatures', `${creatureId}.webp`);
  const hasImage = fs.existsSync(imgPath);

  return NextResponse.json({
    creatureId,
    hasImage,
    imageUrl: hasImage ? `/creatures/${creatureId}.webp` : null,
  });
}
