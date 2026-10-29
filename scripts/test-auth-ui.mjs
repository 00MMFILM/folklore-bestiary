// Render account states without sending mail, using browser credentials, or
// calling a paid provider. Also exercise the bounded login draft parser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (name) => {
    if (!name.startsWith('@/') && !name.startsWith('.')) return require(name);
    const resolved = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(relative), name);
    if (resolved.endsWith('.json')) return require(path.join(root, resolved));
    const file = ['.ts', '.tsx', '.js'].map((extension) => resolved + extension).find((candidate) => fs.existsSync(path.join(root, candidate)));
    return file ? load(file) : require(path.join(root, resolved));
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(relative, module.exports);
  return module.exports;
}

const { default: LoginForm } = load('components/LoginForm.tsx');
const authModule = load('components/ScenarioAuth.tsx');
const { default: ScenarioAuth, scenarioErrorMessage } = authModule;
const { metadata } = load('app/[locale]/login/page.tsx');
const { parseScenarioLoginDraft } = load('lib/scenario-login-draft.ts');
assert.equal(metadata.robots.index, false);
assert.equal(metadata.robots.googleBot.index, false);
for (const locale of ['ko', 'en', 'ja', 'zh']) {
  const html = renderToStaticMarkup(React.createElement(LoginForm, { locale }));
  assert.ok(html.includes(`lang="${locale}"`));
  assert.ok(html.includes('OpenAI'));
  assert.ok(html.includes(`href="/?lang=${locale}"`));
  assert.ok(!html.includes('type="email"'), 'Unconfigured providers must be hidden');
  const auth = { config: { google: false, email: false, scenario: false }, ready: true, session: null, quota: null, errorCode: '', signOut: async () => {}, refreshQuota: async () => {} };
  const render = () => renderToStaticMarkup(React.createElement(ScenarioAuth, { auth, locale }));
  assert.ok(!render().includes(`href="/${locale}/login"`));
  auth.config = { google: true, email: false, scenario: true };
  assert.ok(render().includes(`href="/${locale}/login"`));
  if (locale === 'en') assert.ok(!render().includes('or email'));
  auth.config = { google: false, email: true, scenario: true };
  assert.ok(!render().includes('Google'));
  auth.session = { user: { id: 'test', email: 'visitor@example.test' } };
  auth.quota = { enabled: true, remaining: 2, limit: 3, resetAt: '2026-10-29T00:00:00.000Z' };
  assert.ok(render().includes('visitor@example.test'));
  assert.ok(render().includes('2 / 3'));
  assert.ok(!render().includes(`href="/${locale}/login"`));
}
assert.ok(scenarioErrorMessage('AUTH_REQUIRED', 'ko').includes('로그인'));
assert.ok(scenarioErrorMessage('USER_LIMIT', 'en').includes('allowance'));
assert.ok(scenarioErrorMessage('GLOBAL_LIMIT', 'en').includes('reset time'));
assert.ok(scenarioErrorMessage('RATE_LIMIT', 'en').includes('one minute'));
const realHook = authModule.useScenarioAuth;
try {
  const auth = { config: { google: true, email: false, scenario: true }, ready: true, session: null, signOut: async () => {} };
  authModule.useScenarioAuth = () => auth;
  const renderLogin = () => renderToStaticMarkup(React.createElement(LoginForm, { locale: 'en' }));
  assert.ok(renderLogin().includes('Continue with Google'));
  assert.ok(!renderLogin().includes('type="email"'));
  auth.config = { google: false, email: true, scenario: true };
  assert.ok(renderLogin().includes('type="email"'));
  assert.ok(!renderLogin().includes('Continue with Google'));
  auth.config = { google: true, email: true, scenario: true };
  assert.ok(renderLogin().includes('Continue with Google'));
  assert.ok(renderLogin().includes('type="email"'));
  auth.session = { user: { email: 'visitor@example.test' } };
  assert.ok(renderLogin().includes('You are signed in'));
  assert.ok(!renderLogin().includes('type="email"'));
} finally { authModule.useScenarioAuth = realHook; }

const now = Date.now();
const valid = { version: 1, savedAt: now, genreId: 'horror', beingIds: ['kr-dokkaebi'], name: 'Mina', role: 'Writer', era: 'Modern', customEra: '', keywords: ['memory'], keywordInput: 'moon', tone: 'mystery' };
const parse = (value) => parseScenarioLoginDraft(JSON.stringify(value), now);
assert.deepEqual(parse(valid), valid);
assert.equal(parse({ ...valid, savedAt: now - 86400001 }), null, 'Expired drafts are not restored');
assert.equal(parse({ ...valid, savedAt: now + 1 }), null);
assert.equal(parse({ ...valid, name: 7 }), null);
assert.equal(parse({ ...valid, beingIds: ['x', 'x'] }), null);
assert.equal(parse({ ...valid, beingIds: ['a', 'b', 'c', 'd', 'e'] }), null);
assert.equal(parse({ ...valid, keywords: ['a', 'b', 'c', 'd', 'e', 'f'] }), null);
assert.equal(parse({ ...valid, customEra: 'x'.repeat(501) }), null);
assert.equal(parseScenarioLoginDraft('x'.repeat(12001), now), null);
assert.equal(parseScenarioLoginDraft('{broken', now), null);
assert.ok(!Object.hasOwn(parse({ ...valid, access_token: 'never-restore-this' }), 'access_token'));
console.log('PASS: four localized login pages, provider readiness, account/quota panels, error copy, noindex, and bounded login drafts. No real email or paid API calls.');
