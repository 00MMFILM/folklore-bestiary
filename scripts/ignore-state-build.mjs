import { execFileSync } from 'node:child_process';
// Compare with the last deployed SHA, not HEAD^: content may be followed by a state-only commit.
const previous=process.env.VERCEL_GIT_PREVIOUS_SHA;
if(!previous) process.exit(1);
try {
  const files=execFileSync('git',['diff','--name-only',previous,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  const stateOnly=files.every(f=>f.startsWith('scripts/automation/') || f==='scripts/crawl-state.json');
  console.log(stateOnly ? 'Only automation state changed: skip build' : 'Site/code changed: build');
  process.exit(stateOnly ? 0 : 1);
} catch { process.exit(1); }
