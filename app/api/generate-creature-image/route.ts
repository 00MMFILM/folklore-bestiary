import { NextRequest, NextResponse } from 'next/server';
import { getCreatureImage } from '@/lib/folklore-data';

// No paid provider call until verified user access and durable quotas are implemented.
export async function POST() {
  return NextResponse.json(
    { code: 'PAID_GENERATION_DISABLED', error: 'AI image generation is temporarily unavailable.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

// ─── 생성 상태 확인 (GET) ───
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatureId = searchParams.get('creatureId');

  if (!creatureId) {
    return NextResponse.json({ error: 'creatureId is required' }, { status: 400 });
  }

  const imageUrl = getCreatureImage(creatureId);

  return NextResponse.json({
    creatureId,
    hasImage: !!imageUrl,
    imageUrl,
  });
}
