import { authenticateScenarioUser, requireScenarioEnabled, scenarioQuota, ScenarioAccessError } from '@/lib/scenario-access';
import { readScenarioInput, ScenarioInputError } from '@/lib/scenario-input';
import { scenarioMessages } from '@/lib/scenario-prompts';

export const runtime = 'nodejs';
export const maxDuration = 180;

function failure(error: unknown): Response {
  const code = error instanceof ScenarioInputError ? 'INVALID_INPUT' : error instanceof ScenarioAccessError ? error.code : 'AI_UNAVAILABLE';
  const status = error instanceof ScenarioInputError || error instanceof ScenarioAccessError ? error.status : 503;
  return Response.json({ code, error: code }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request) {
  try {
    const userId = await authenticateScenarioUser(request);
    requireScenarioEnabled();
    const quota = await scenarioQuota(request, userId, false);
    return Response.json({ enabled: true, remaining: quota.remaining, limit: 3, resetAt: quota.reset_at, code: quota.code }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticateScenarioUser(request);
    requireScenarioEnabled();
    const messages = scenarioMessages(await readScenarioInput(request));
    if (request.signal.aborted) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
    // One atomic database reservation covers user, global day/month and cooldown
    // limits. Failed or canceled provider calls retain their reservation.
    const quota = await scenarioQuota(request, userId, true);
    if (!quota.allowed) return Response.json({ code: quota.code, error: quota.code, remaining: quota.remaining, resetAt: quota.reset_at }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    if (request.signal.aborted) throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');

    const aborter = new AbortController();
    const cancel = () => aborter.abort();
    request.signal.addEventListener('abort', cancel, { once: true });
    // The deadline stays active for the entire streamed response, not just until
    // the provider returns headers.
    const deadline = setTimeout(cancel, 120000);
    const cleanup = () => { clearTimeout(deadline); request.signal.removeEventListener('abort', cancel); };
    try {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, stream: true, temperature: 0.85, max_tokens: 10000 }),
        signal: aborter.signal,
      });
      if (!upstream.ok || !upstream.body || aborter.signal.aborted) {
        void upstream.body?.cancel().catch(() => {});
        throw new ScenarioAccessError(503, 'AI_UNAVAILABLE');
      }
      const reader = upstream.body.getReader();
      let finished = false;
      let onAbort: () => void = () => {};
      const finish = () => { finished = true; aborter.signal.removeEventListener('abort', onAbort); cleanup(); };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          onAbort = () => {
            if (finished) return;
            finish();
            void reader.cancel().catch(() => {});
            controller.error(new Error('AI stream interrupted'));
          };
          aborter.signal.addEventListener('abort', onAbort, { once: true });
        },
        async pull(controller) {
          try {
            const chunk = await reader.read();
            if (finished) return;
            if (chunk.done) { finish(); controller.close(); }
            else controller.enqueue(chunk.value);
          } catch {
            if (!finished) { finish(); aborter.abort(); controller.error(new Error('AI stream interrupted')); }
          }
        },
        async cancel() { finish(); aborter.abort(); await reader.cancel().catch(() => {}); },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', 'X-Scenario-Remaining': String(quota.remaining) } });
    } catch (error) {
      aborter.abort(); cleanup(); throw error;
    }
  } catch (error) { return failure(error); }
}
