import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { selectCandidates, recordAttempt, finishRun, evaluateHealth } from './lib/automation-state.mjs';

const now = Date.parse('2026-11-14T06:00:00Z');
test('rejected candidates stay deferred after a process restart; untouched candidates advance', () => {
  const candidates = [{id:'first'}, {id:'second'}, {id:'third'}];
  const state = {};
  recordAttempt(state, 'first', 'no_source', now);
  recordAttempt(state, 'second', 'rejected', now);
  assert.deepEqual(selectCandidates(candidates, JSON.parse(JSON.stringify(state)), 1, now).map(x=>x.id), ['third']);
  assert.equal(selectCandidates(candidates, state, 3, now + 8*86400000).length, 3);
});
test('zero output is counted, productivity resets the streak, fatal errors remain visible', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'folklore-report-'));
  finishRun('images', {attempted:1, generated:0, errors:1, remaining:2}, root, now);
  let r=finishRun('images', {attempted:1, generated:0, errors:1, remaining:2}, root, now+1000);
  assert.equal(r.zeroStreak,2);
  assert.equal(r.lastResult.errors,1);
  r=finishRun('images', {attempted:1, generated:1, errors:0, remaining:1},root,now+2000);
  assert.equal(r.zeroStreak,0);
  assert.equal(r.lastProductiveRun,new Date(now+2000).toISOString());
  fs.rmSync(root,{recursive:true});
});
test('watchdog detects failed jobs, stale schedules, and repeated empty runs; finished backlog is healthy', () => {
  const healthy=()=>Object.fromEntries(['crawl','images','articles'].map(k=>[k,{lastRun:new Date(now).toISOString(),zeroStreak:0,lastResult:{errors:0,remaining:0}}]));
  assert.deepEqual(evaluateHealth(healthy(),{},now),[]);
  let r=healthy(); r.images.zeroStreak=3; r.images.lastResult.remaining=10;
  assert.match(evaluateHealth(r,{},now).join('\n'),/images.*0건/);
  r=healthy(); r.crawl.lastRun=new Date(now-49*3600000).toISOString();
  assert.match(evaluateHealth(r,{},now).join('\n'),/crawl.*미실행/);
  assert.match(evaluateHealth(healthy(),{images:{conclusion:'failure'}},now).join('\n'),/images.*failure/);
});
test('image CLI exits nonzero and writes a failed report when the model is unavailable', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'folklore-image-'));
  fs.mkdirSync(path.join(root,'scripts/lib'),{recursive:true});
  for (const f of ['generate-images.mjs','lib/automation-state.mjs']) fs.copyFileSync(new URL(f,import.meta.url),path.join(root,'scripts',f));
  fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'));
  fs.writeFileSync(path.join(root,'input.json'),JSON.stringify([{id:'kr-test',name:'Test',type:'Dragon',country:'Korea',region:'East Asia',d:'A dragon.'}]));
  fs.writeFileSync(path.join(root,'mock.mjs'),`globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'model unavailable'}}),{status:404});`);
  const p=spawnSync(process.execPath,['--import',path.join(root,'mock.mjs'),path.join(root,'scripts/generate-images.mjs')],{cwd:root,encoding:'utf8',env:{...process.env,OPENAI_API_KEY:'test-placeholder',IMAGE_INPUT:path.join(root,'input.json')}});
  assert.equal(p.status,1,p.stdout+p.stderr);
  const report=JSON.parse(fs.readFileSync(path.join(root,'scripts/automation/images.json'),'utf8'));
  assert.equal(report.lastResult.errors,1);
  assert.equal(report.lastResult.generated,0);
  fs.rmSync(root,{recursive:true});
});

test('article CLI advances past a missing source on its next execution without spending API calls', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'folklore-articles-'));
  fs.mkdirSync(path.join(root,'scripts/lib'),{recursive:true}); fs.mkdirSync(path.join(root,'lib'));
  for(const f of ['generate-articles.mjs','lib/automation-state.mjs']) fs.copyFileSync(new URL(f,import.meta.url),path.join(root,'scripts',f));
  const data=[{i:'KR',b:[{id:'first',n:'Missing one',f:10,d:'abc'},{id:'second',n:'Missing two',f:9,d:'def'}]}];
  fs.writeFileSync(path.join(root,'lib/folklore-data.ts'),'export const FOLKLORE_DATA: CountryData[] = '+JSON.stringify(data)+';');
  fs.writeFileSync(path.join(root,'mock.mjs'),`globalThis.fetch=async(url)=>{if(!url.includes('wikipedia.org'))throw new Error('Unexpected paid API call');return new Response(JSON.stringify({query:{pages:{'-1':{missing:true}}}}));};`);
  for(let i=0;i<2;i++) {
    const p=spawnSync(process.execPath,['--import',path.join(root,'mock.mjs'),'scripts/generate-articles.mjs','--batch','1','--concurrency','1'],{cwd:root,encoding:'utf8',env:{...process.env,OPENAI_API_KEY:'test-placeholder'}});
    assert.equal(p.status,0,p.stderr+p.stdout);
  }
  const attempts=JSON.parse(fs.readFileSync(path.join(root,'scripts/automation/article-attempts.json')));
  assert.deepEqual(Object.keys(attempts),['first','second']);
  const report=JSON.parse(fs.readFileSync(path.join(root,'scripts/automation/articles.json')));
  assert.equal(report.zeroStreak,2); assert.equal(report.lastResult.apiCalls,0);
  fs.rmSync(root,{recursive:true});
});

test('empty crawl progress is committed and a second execution moves to different categories', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'folklore-crawl-'));
  fs.mkdirSync(path.join(root,'scripts/lib'),{recursive:true}); fs.mkdirSync(path.join(root,'lib'));
  for(const f of ['crawl-wikipedia-folklore.mjs','commit-automation.sh','lib/automation-state.mjs']) fs.copyFileSync(new URL(f,import.meta.url),path.join(root,'scripts',f));
  fs.writeFileSync(path.join(root,'lib/folklore-data.ts'),'export const FOLKLORE_DATA: CountryData[] = [];');
  fs.writeFileSync(path.join(root,'mock.mjs'),`globalThis.fetch=async()=>new Response(JSON.stringify({query:{categorymembers:[]}}));`);
  const run=(cmd,args,env={})=>{
    const p=spawnSync(cmd,args,{cwd:root,encoding:'utf8',env:{...process.env,...env}});
    assert.equal(p.status,0,p.stdout+p.stderr);return p.stdout;
  };
  run('git',['init','-q']); run('git',['add','.']);
  run('git',['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','Fixture']);
  run(process.execPath,['--import',path.join(root,'mock.mjs'),'scripts/crawl-wikipedia-folklore.mjs']);
  run('bash',['scripts/commit-automation.sh','scripts/crawl-state.json','scripts/automation'],{AUTOMATION_LOCAL_ONLY:'1'});
  const first=JSON.parse(run('git',['show','HEAD:scripts/crawl-state.json']));
  run(process.execPath,['--import',path.join(root,'mock.mjs'),'scripts/crawl-wikipedia-folklore.mjs']);
  const second=JSON.parse(fs.readFileSync(path.join(root,'scripts/crawl-state.json')));
  assert.notEqual(first.lastCategoryIndex,second.lastCategoryIndex);
  assert.equal(second.runs,first.runs+1);
  fs.rmSync(root,{recursive:true});
});

test('state-only build skip compares all changes since the deployed commit', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'folklore-build-'));
  const git=(...args)=>spawnSync('git',args,{cwd:root,encoding:'utf8'});
  git('init','-q'); git('config','user.name','Test');git('config','user.email','test@example.com');
  fs.mkdirSync(path.join(root,'scripts/automation'),{recursive:true});
  fs.writeFileSync(path.join(root,'site.txt'),'old');git('add','.');git('commit','-qm','base');
  const base=git('rev-parse','HEAD').stdout.trim();
  fs.writeFileSync(path.join(root,'scripts/automation/images.json'),'{}');git('add','.');git('commit','-qm','state');
  const check=()=>spawnSync(process.execPath,[fileURLToPath(new URL('ignore-state-build.mjs',import.meta.url))],{cwd:root,env:{...process.env,VERCEL_GIT_PREVIOUS_SHA:base}}).status;
  assert.equal(check(),0);
  fs.writeFileSync(path.join(root,'site.txt'),'new');git('add','.');git('commit','-qm','content');
  fs.writeFileSync(path.join(root,'scripts/automation/images.json'),'{"runs":1}');git('add','.');git('commit','-qm','state again');
  assert.equal(check(),1);
  fs.rmSync(root,{recursive:true});
});
