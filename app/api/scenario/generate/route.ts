// Public paid generation is paused until verified user access and durable quotas exist.
// Keep this unconditional: a client token, Origin header, or env flag must not reopen it.
export const runtime = 'edge';

export async function POST() {
  return Response.json(
    {
      code: 'PAID_GENERATION_DISABLED',
      error: 'AI generation is temporarily unavailable. Use the free template or writer studio.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
