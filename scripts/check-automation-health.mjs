import { execFileSync } from 'node:child_process';
import { readJson, PIPELINES, evaluateHealth } from './lib/automation-state.mjs';

const repo=process.env.GITHUB_REPOSITORY || '00MMFILM/folklore-bestiary';
function api(endpoint, method='GET', body) {
  const args=['api',`repos/${repo}/${endpoint}`,'--method',method];
  if(body) args.push('--input','-');
  return JSON.parse(execFileSync('gh',args,{encoding:'utf8',input:body ? JSON.stringify(body):undefined}));
}
const reports={}, runs={};
for(const [name,config] of Object.entries(PIPELINES)) {
  reports[name]=readJson(`scripts/automation/${name}.json`,null);
  runs[name]=api(`actions/workflows/${config.workflow}/runs?branch=main&status=completed&per_page=1`).workflow_runs[0];
}
const problems=evaluateHealth(reports,runs);
const translation=api('actions/workflows/translate-creatures.yml/runs?branch=main&status=completed&per_page=1').workflow_runs[0];
if(!translation || Date.now()-Date.parse(translation.created_at)>48*3600000 || translation.conclusion!=='success') problems.push(`translate: 미실행 또는 실패 ${translation?.html_url || ''}`);
// Track Vercel's result on the latest content/code commit (state-only commits can be ignored).
const contentCommits=api('commits?sha=main&per_page=30');
for(const commit of contentCommits) {
  const detail=api(`commits/${commit.sha}`);
  if(detail.files.every(f=>f.filename.startsWith('scripts/automation/') || f.filename==='scripts/crawl-state.json')) continue;
  const statuses=api(`commits/${commit.sha}/status`).statuses;
  const deployment=statuses.find(s=>s.context==='Vercel');
  const age=Date.now()-Date.parse(commit.commit.committer.date);
  if(deployment && ['error','failure'].includes(deployment.state)) problems.push(`deploy: Vercel ${deployment.state} ${deployment.target_url}`);
  else if(age>2*3600000 && (!deployment || deployment.state!=='success')) problems.push(`deploy: 2시간 이상 배포 완료 확인 안 됨 (${commit.sha.slice(0,7)})`);
  break;
}
const testAlert=process.env.TEST_ALERT==='true';
const title=testAlert ? '[알림 테스트] 괴물도감 자동화 감시' : '[자동화 경고] 괴물도감 업데이트 중단';
if(testAlert) problems.push('알림 경로 검증용 테스트입니다. 실제 장애를 추가로 만든 것이 아닙니다.');
const body=`@00MMFILM\n\n${problems.map(p=>`- ${p}`).join('\n')}\n\n확인: ${new Date().toISOString()}\n감시 실행: https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID || ''}\n\n${Object.entries(reports).map(([name,r])=>`${name}: 최근 ${r?.lastRun || '없음'}, 연속 0건 ${r?.zeroStreak ?? '?'}, 최근 결과 ${JSON.stringify(r?.lastResult || {})}`).join('\n\n')}`;
const open=api('issues?state=open&creator=github-actions%5Bbot%5D&per_page=100').find(i=>i.title===title);
if(problems.length) {
  if(open) api(`issues/${open.number}`,'PATCH',{body});
  else {
    const issue=api('issues','POST',{title,body,assignees:['00MMFILM']});
    console.log(`Alert created: ${issue.html_url}`);
  }
  console.error(problems.join('\n'));
  if(!testAlert) process.exitCode=1;
} else if(open) {
  api(`issues/${open.number}/comments`,'POST',{body:'모든 점검 항목이 정상으로 회복됐습니다. '+new Date().toISOString()});
  api(`issues/${open.number}`,'PATCH',{state:'closed'});
  console.log('Recovered: alert closed');
} else console.log('Healthy: schedules, output, and deployment checked');
