// No network or real credentials: exercise both HTTP handlers with fetch trapped.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadRoute(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)((id) => {
    if (id === '@/lib/folklore-data') return { getCreatureImage: (id) => id === 'known' ? '/creatures/known.webp' : null };
    return require(id);
  }, module, module.exports);
  return module.exports;
}

const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENAI_API_KEY;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls++;
  return new Response('{}', { status: 502 });
};
process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';

try {
  const routes = [
    loadRoute('../app/api/scenario/generate/route.ts'),
    loadRoute('../app/api/generate-creature-image/route.ts'),
  ];
  // These syntactically valid requests previously reached the paid provider.
  const bodies = [{}, { creatureId: 'known', prompt: 'test only' }];
  for (const [i, route] of routes.entries()) {
    const response = await route.POST(new Request('https://example.com/api/test', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bodies[i]),
    }));
    assert.equal(fetchCalls, 0, 'Public POST must never call a paid provider');
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'PAID_GENERATION_DISABLED');
    assert.equal(response.headers.get('cache-control'), 'no-store');

    // Arbitrary credentials, Origin headers and malformed bodies cannot reopen it.
    const requests = Array.from({ length: 25 }, () => new Request('https://example.com/api/test', {
      method: 'POST', headers: { authorization: 'Bearer invented', origin: 'https://example.com' }, body: '{broken',
    }));
    for (const result of await Promise.all(requests.map((request) => route.POST(request)))) {
      assert.equal(result.status, 503);
    }
    const noBodyRead = { get json() { throw new Error('Body must not be parsed while disabled'); } };
    assert.equal((await route.POST(noBodyRead)).status, 503);
  }
  const cached = await routes[1].GET(new Request('https://example.com/api/generate-creature-image?creatureId=known'));
  assert.equal(cached.status, 200);
  assert.deepEqual(await cached.json(), { creatureId: 'known', hasImage: true, imageUrl: '/creatures/known.webp' });
  assert.equal((await routes[1].GET(new Request('https://example.com/api/generate-creature-image'))).status, 400);
  assert.equal(fetchCalls, 0);
  console.log('PASS: both paid POSTs blocked, 50 parallel requests denied, no provider calls, image GET preserved');
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
}
