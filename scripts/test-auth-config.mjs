import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../app/api/auth/config/route.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', js)(module, module.exports);
const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'AUTH_EMAIL_ENABLED', 'SCENARIO_AI_ENABLED'];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
try {
  for (const key of keys) delete process.env[key];
  globalThis.fetch = () => { throw new Error('No network expected'); };
  assert.deepEqual(await (await module.exports.GET()).json(), { google: false, email: false, scenario: false });
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-private-service';
  process.env.OPENAI_API_KEY = 'test-private-ai';
  globalThis.fetch = async () => Response.json({ external: { google: true, email: true }, secret: 'never-expose' });
  assert.deepEqual(await (await module.exports.GET()).json(), { google: true, email: false, scenario: false });
  process.env.AUTH_EMAIL_ENABLED = 'true';
  process.env.SCENARIO_AI_ENABLED = 'true';
  const response = await module.exports.GET();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { google: true, email: true, scenario: true });
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.deepEqual(await (await module.exports.GET()).json(), { google: false, email: false, scenario: false });
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  assert.deepEqual(await (await module.exports.GET()).json(), { google: false, email: false, scenario: false });
  console.log('PASS: auth capability flags fail closed; email requires verified SMTP flag; no secrets returned');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
}
