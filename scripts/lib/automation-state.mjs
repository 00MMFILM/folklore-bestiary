import fs from 'node:fs';
import path from 'node:path';

export function readJson(file, fallback = {}) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

export function selectCandidates(candidates, attempts, limit, now = Date.now()) {
  return candidates.filter(c => !attempts[c.id] || Date.parse(attempts[c.id].retryAfter) <= now)
    .sort((a,b) => (attempts[a.id]?.at ? Date.parse(attempts[a.id].at) : 0) - (attempts[b.id]?.at ? Date.parse(attempts[b.id].at) : 0))
    .slice(0, limit);
}

export function recordAttempt(attempts, id, status, now = Date.now()) {
  const days = ['no_source','thin','rejected'].includes(status) ? 7 : 1;
  attempts[id] = { status, at:new Date(now).toISOString(), retryAfter:new Date(now + days*86400000).toISOString() };
}

export function finishRun(name, result, root = process.cwd(), now = Date.now()) {
  const file=path.join(root, 'scripts/automation', `${name}.json`);
  const prev=readJson(file);
  const at=new Date(now).toISOString();
  const report={
    lastRun:at, runs:(prev.runs || 0)+1,
    lastProductiveRun:result.generated > 0 ? at : (prev.lastProductiveRun || null),
    zeroStreak:result.generated === 0 && result.remaining !== 0 ? (prev.zeroStreak || 0)+1 : 0,
    lastResult:result,
    runUrl:process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  };
  writeJson(file,report);
  if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### ${name}\n\n${JSON.stringify(result)}\n\n연속 결과 0건: ${report.zeroStreak}\n`);
  return report;
}

export const PIPELINES = {
  crawl:{workflow:'crawl-folklore.yml',maxHours:36,zeroLimit:12},
  images:{workflow:'generate-images.yml',maxHours:48,zeroLimit:3},
  articles:{workflow:'generate-articles.yml',maxHours:48,zeroLimit:3},
};

export function evaluateHealth(reports, latestRuns = {}, now = Date.now()) {
  const problems=[];
  for(const [name,config] of Object.entries(PIPELINES)) {
    const r=reports[name];
    const run=latestRuns[name];
    if(run?.conclusion && run.conclusion !== 'success' && run.conclusion !== 'skipped') problems.push(`${name}: 실행 ${run.conclusion} ${run.html_url || ''}`);
    if(!r?.lastRun || !Number.isFinite(Date.parse(r.lastRun)) || now-Date.parse(r.lastRun)>config.maxHours*3600000) problems.push(`${name}: ${config.maxHours}시간 이상 미실행 또는 상태 저장 누락`);
    if(r?.lastResult?.errors > 0) problems.push(`${name}: 최근 실행 오류 ${r.lastResult.errors}건 ${r.runUrl || ''}`);
    if(r?.zeroStreak >= config.zeroLimit && r?.lastResult?.remaining !== 0) problems.push(`${name}: ${r.zeroStreak}회 연속 새 콘텐츠 0건 ${r.runUrl || ''}`);
  }
  return problems;
}
