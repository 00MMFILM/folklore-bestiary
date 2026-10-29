// Security regression tests. Auth, database and paid provider are all mocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(new URL('..', import.meta.url).pathname);
const userId = 'e36e1e2b-083e-4342-84b9-c26841a46e52';
const resetAt = '2026-10-29T00:00:00.000Z';
const valid = { genre: 'Folklore mystery', beings: [{ n: 'Bulgasari', t: 'Monster', d: 'An iron-eating creature.', country: 'Korea', gf: ['Mystery'], vk: ['iron hide'], src: ['Folklore reference'] }], protagonist: { name: '', role: '' }, era: 'Modern', keywords: ['promise'], tone: 'Hopeful', lang: 'en' };
const event = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\ndata: [DONE]\n\n';
const envNames = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SCENARIO_AI_ENABLED'];
const originalEnv = Object.fromEntries(envNames.map(k => [k, process.env[k]]));
const originalFetch = globalThis.fetch;
const originalTimeout = globalThis.setTimeout;
let paidCalls = [], rpcCalls = [], authCalls = [], clients = [], state;
function reset() {
  paidCalls = []; rpcCalls = []; authCalls = []; clients = [];
  state = { verified: true, user: { id: userId, email: 'writer@example.com', email_confirmed_at: resetAt, is_anonymous: false }, rpcError: false, rpcData: { allowed: true, code: 'ALLOWED', remaining: 2, reset_at: resetAt }, providerStatus: 200 };
  process.env.OPENAI_API_KEY = 'test-provider-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
  process.env.SCENARIO_AI_ENABLED = 'true';
}
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; cache.set(filename, module);
  new Function('require', 'module', 'exports', js)((id) => {
    if (id === '@supabase/supabase-js') return { createClient(url, key, options) {
      clients.push({ url, key, options });
      return {
        auth: { async getUser(token) { authCalls.push(token); return { data: { user: state.verified && token === 'verified-token' ? state.user : null }, error: state.verified && token === 'verified-token' ? null : new Error('invalid') }; } },
        async rpc(name, params) { rpcCalls.push({ name, params }); return { data: state.rpc ? state.rpc(name, params) : state.rpcData, error: state.rpcError ? new Error('secret database error') : null }; },
      };
    } };
    if (id.startsWith('@/')) return load(path.join(root, id.slice(2) + '.ts'));
    if (id.startsWith('./')) return load(path.join(path.dirname(filename), id + '.ts'));
    return require(id);
  }, module, module.exports);
  return module.exports;
}
function request(body = valid, headers = {}, signal) {
  return new Request('https://mythoria.example/api/scenario/generate', { method: 'POST', headers: { authorization: 'Bearer verified-token', 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body), signal });
}
async function expectError(response, status, code) {
  assert.equal(response.status, status);
  assert.equal((await response.json()).code, code);
  assert.equal(response.headers.get('cache-control'), 'no-store');
}
try {
  reset();
  globalThis.fetch = async (url, init) => {
    paidCalls.push({ url, init });
    if (state.providerWait) return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    if (state.providerStream) return new Response(state.providerStream, { headers: { 'content-type': 'text/event-stream' } });
    return new Response(state.providerStatus === 200 ? event : 'secret-provider-error', { status: state.providerStatus, headers: { 'content-type': 'text/event-stream' } });
  };
  const route = load(path.join(root, 'app/api/scenario/generate/route.ts'));

  // Regression: the original endpoint called a paid model for an anonymous empty body.
  await expectError(await route.POST(request({}, { authorization: '' })), 401, 'AUTH_REQUIRED');
  assert.equal(authCalls.length, 0);
  assert.equal(paidCalls.length, 0);
  await expectError(await route.POST(request({}, { authorization: 'Bearer invented', 'x-user-id': userId })), 401, 'AUTH_REQUIRED');
  assert.equal(paidCalls.length, 0);
  assert.equal(rpcCalls.length, 0);

  for (const user of [{ ...state.user, email_confirmed_at: null }, { ...state.user, is_anonymous: true }, { ...state.user, email: undefined }]) {
    reset(); state.user = user;
    await expectError(await route.POST(request()), 403, 'EMAIL_UNVERIFIED');
    assert.equal(paidCalls.length, 0);
  }
  for (const body of [{}, { ...valid, userId: 'other-person' }, { ...valid, model: 'expensive-model' }, { ...valid, beings: [] }, { ...valid, beings: Array(5).fill(valid.beings[0]) }, { ...valid, keywords: {} }, { ...valid, protagonist: { name: [] } }, { ...valid, lang: 'invented' }, { ...valid, beings: [{ ...valid.beings[0], src: [{}] }] }, '{broken']) {
    reset();
    await expectError(await route.POST(request(body)), 400, 'INVALID_INPUT');
    assert.equal(rpcCalls.length, 0); assert.equal(paidCalls.length, 0);
  }
  reset();
  await expectError(await route.POST(request(valid, { 'content-type': 'text/plain' })), 400, 'INVALID_INPUT');
  await expectError(await route.POST(request('가'.repeat(12000))), 413, 'INVALID_INPUT');
  await expectError(await route.POST(request(valid, { 'content-length': '32769' })), 413, 'INVALID_INPUT');
  assert.equal(paidCalls.length, 0);
  // Actual streamed bytes, not a claimed Content-Length, enforce the cap.
  const chunks = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(20000)); c.enqueue(new Uint8Array(20000)); c.close(); } });
  await expectError(await route.POST(new Request('https://example.com', { method: 'POST', headers: { authorization: 'Bearer verified-token', 'content-type': 'application/json', 'content-length': '1' }, body: chunks, duplex: 'half' })), 413, 'INVALID_INPUT');
  assert.equal(rpcCalls.length, 0);

  reset();
  // A byte-bound body still cannot exceed the combined system + user prompt cap.
  const promptHeavy = { ...valid, lang: 'ko', beings: Array.from({ length: 4 }, () => ({ ...valid.beings[0], d: '가'.repeat(2650) })) };
  assert.ok(new TextEncoder().encode(JSON.stringify(promptHeavy)).length < 32768);
  await expectError(await route.POST(request(promptHeavy)), 413, 'INVALID_INPUT');
  assert.equal(rpcCalls.length, 0);

  // Existing catalog fields contain arrays as well as strings. Validate every
  // record to guard against silently rejecting ordinary creature selections.
  const catalogLine = fs.readFileSync(path.join(root, 'lib/folklore-data.ts'), 'utf8').split('\n').find(line => line.startsWith('export const FOLKLORE_DATA:'));
  const catalog = JSON.parse(catalogLine.slice(catalogLine.indexOf('= ') + 2).replace(/;$/, ''));
  const { validateScenarioInput } = load(path.join(root, 'lib/scenario-input.ts'));
  for (const country of catalog) for (const creature of country.b) {
    const selected = Object.fromEntries(['n', 't', 'd', 'ct', 'ln', 'ab', 'wk', 'sh', 'gf', 'vk', 'src'].filter(k => creature[k] !== undefined).map(k => [k, creature[k]]));
    assert.doesNotThrow(() => validateScenarioInput({ ...valid, beings: [{ ...selected, country: 'Catalog country' }] }), creature.n);
  }

  reset(); process.env.SCENARIO_AI_ENABLED = 'false';
  await expectError(await route.POST(request()), 503, 'AI_UNAVAILABLE');
  assert.equal(paidCalls.length, 0); assert.equal(rpcCalls.length, 0);
  reset(); delete process.env.OPENAI_API_KEY;
  await expectError(await route.POST(request()), 503, 'AI_UNAVAILABLE');
  assert.equal(rpcCalls.length, 0);
  reset(); state.rpcError = true;
  await expectError(await route.POST(request()), 503, 'AI_UNAVAILABLE');
  assert.equal(paidCalls.length, 0);
  for (const code of ['USER_LIMIT', 'GLOBAL_LIMIT', 'RATE_LIMIT', 'GENERATION_DISABLED']) {
    reset(); state.rpcData = { allowed: false, code, remaining: 0, reset_at: resetAt };
    await expectError(await route.POST(request()), code === 'GENERATION_DISABLED' ? 503 : 429, code === 'GENERATION_DISABLED' ? 'AI_UNAVAILABLE' : code);
    assert.equal(paidCalls.length, 0);
  }
  for (const rpcData of [null, {}, { allowed: 'true' }, { allowed: true, code: 'ALLOWED', remaining: -1, reset_at: resetAt }, { allowed: true, code: 'ALLOWED', remaining: 3, reset_at: 'invalid' }]) {
    reset(); state.rpcData = rpcData;
    await expectError(await route.POST(request()), 503, 'AI_UNAVAILABLE');
    assert.equal(paidCalls.length, 0);
  }
  reset();
  const success = await route.POST(request());
  assert.equal(success.status, 200); assert.equal(await success.text(), event);
  assert.equal(success.headers.get('cache-control'), 'no-store');
  assert.equal(paidCalls.length, 1); assert.equal(rpcCalls.length, 1);
  assert.deepEqual(rpcCalls[0], { name: 'reserve_scenario_generation', params: { p_user_id: userId } });
  const providerRequest = JSON.parse(paidCalls[0].init.body);
  assert.equal(providerRequest.model, 'gpt-4o-mini'); assert.equal(providerRequest.max_tokens, 10000);
  assert.equal(providerRequest.stream, true);
  assert.match(providerRequest.messages[1].content, /iron hide/);
  assert.equal(clients[0].key, 'test-anon');
  assert.equal(clients[1].key, 'test-service');
  for (const client of clients) {
    assert.equal(client.options.auth.persistSession, false);
    assert.equal(client.options.auth.autoRefreshToken, false);
    assert.equal(client.options.auth.detectSessionInUrl, false);
  }
  reset(); let reserved = 0;
  state.rpc = () => ++reserved <= 3 ? { allowed: true, code: 'ALLOWED', remaining: 3 - reserved, reset_at: resetAt } : { allowed: false, code: 'USER_LIMIT', remaining: 0, reset_at: resetAt };
  const parallel = await Promise.all(Array.from({ length: 25 }, () => route.POST(request())));
  assert.equal(parallel.filter(r => r.status === 200).length, 3);
  assert.equal(parallel.filter(r => r.status === 429).length, 22);
  assert.equal(paidCalls.length, 3);
  await Promise.all(parallel.map(r => r.text()));

  reset(); state.providerStatus = 500;
  const failed = await route.POST(request());
  await expectError(failed, 503, 'AI_UNAVAILABLE');
  assert.equal(rpcCalls.length, 1, 'Failed upstream calls are not refunded');
  reset(); state.providerWait = true;
  globalThis.setTimeout = (fn, ms, ...args) => originalTimeout(fn, ms === 120000 ? 10 : ms, ...args);
  await expectError(await route.POST(request()), 503, 'AI_UNAVAILABLE');
  assert.equal(paidCalls[0].init.signal.aborted, true);
  reset(); const aborter = new AbortController(); state.providerWait = true;
  const canceled = route.POST(request(valid, {}, aborter.signal));
  await new Promise(resolve => originalTimeout(resolve, 1)); aborter.abort();
  await expectError(await canceled, 503, 'AI_UNAVAILABLE');
  assert.equal(paidCalls[0].init.signal.aborted, true);
  // Timeout must stay active after headers arrive, including a stalled response stream.
  reset(); let streamCanceled = false;
  state.providerStream = new ReadableStream({ cancel() { streamCanceled = true; } });
  const stalled = await route.POST(request());
  await assert.rejects(stalled.text());
  assert.equal(streamCanceled, true);
  reset(); streamCanceled = false;
  state.providerStream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(event)); }, cancel() { streamCanceled = true; } });
  const discarded = await route.POST(request());
  await discarded.body.cancel();
  assert.equal(streamCanceled, true);
  assert.equal(paidCalls[0].init.signal.aborted, true);
  assert.equal(rpcCalls.length, 1);

  reset();
  const quota = await route.GET(new Request('https://example.com', { headers: { authorization: 'Bearer verified-token' } }));
  assert.equal(quota.status, 200);
  assert.deepEqual(await quota.json(), { enabled: true, remaining: 2, limit: 3, resetAt, code: 'ALLOWED' });
  assert.deepEqual(rpcCalls[0], { name: 'get_scenario_generation_quota', params: { p_user_id: userId } });
  assert.equal(paidCalls.length, 0);
  await expectError(await route.GET(new Request('https://example.com')), 401, 'AUTH_REQUIRED');
  console.log('PASS: real auth boundary, verified email, bounded JSON, forged identity/model rejection, atomic quota gating, 25 concurrent requests, fail-closed configuration, provider timeout/cancellation, quota GET. No paid calls.');
} finally {
  globalThis.fetch = originalFetch; globalThis.setTimeout = originalTimeout;
  for (const name of envNames) { if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name]; }
}
