// 같은 설화 등장 존재 상호링크 생성 (결정적, 크레딧 0)
//
// 신호: 아티클(content/articles/{id}.json) 본문(ko)에 다른 생물의 한글 이름이
//       언급되면 같은 설화에 함께 등장한 것으로 간주하고 양방향 링크를 만든다.
//
// 정밀도 안전장치:
//   1) 같은 나라(countryCode)로만 게이팅 — 문화권을 넘는 오검출 차단
//   2) 일반명사(드래곤·귀신·거인 등) 이름은 제외 — 광범위 오검출 차단
//   3) 중복 이표기 쌍 제외 — 같은 존재의 다른 표기(apep=Apophis)는 링크 아님
//   4) 한글 이름 2자 이상만 사용
//
// 산출물: content/tale-links.json  →  { creatureId: [{ id, n }] }
// 재실행 안전. 아티클이 늘면(auto-crawl) 재실행 시 링크도 자동 증가.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// ─── FOLKLORE_DATA 파싱 (lib/folklore-data.ts의 JSON 리터럴) ───
function loadCreatures() {
  const ts = fs.readFileSync(path.join(ROOT, "lib", "folklore-data.ts"), "utf8");
  const marker = "export const FOLKLORE_DATA: CountryData[] = ";
  const s = ts.indexOf(marker) + marker.length;
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = s; i < ts.length; i++) {
    const ch = ts[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const DATA = JSON.parse(ts.substring(s, end));
  const creatures = [];
  for (const country of DATA)
    for (const b of country.b || [])
      creatures.push({ ...b, cc: country.i });
  return creatures;
}

// 일반명사(유형어) 차단 목록 — 이름이 곧 종류라 광범위 매칭됨
const GENERIC = new Set([
  "드래곤", "몬스터", "뱀파이어", "늑대인간", "거인", "악마", "유령", "정령",
  "요정", "도깨비", "괴물", "용", "뱀", "악령", "여우", "귀신", "인어", "마녀",
  "좀비", "유니콘", "골렘", "님프", "사티로스", "천사", "마귀", "요괴", "정괴",
]);

function korName(c) {
  if (c.ln) return c.ln;
  const m = (c.n || "").match(/\(([^)]+)\)/);
  return m ? m[1] : null;
}
// 영문 기저명 (괄호 앞) — 중복 이표기 판정용
function baseName(c) {
  return (c.n || "").split("(")[0].trim().toLowerCase();
}
function norm(s) {
  return (s || "").toLowerCase().replace(/[\s\-'’.]/g, "");
}

function main() {
  const creatures = loadCreatures();
  const byId = Object.fromEntries(creatures.map((c) => [c.id, c]));

  const names = creatures
    .map((c) => ({ id: c.id, kn: korName(c), cc: c.cc, base: baseName(c) }))
    .filter((x) => x.kn && x.kn.length >= 2 && !GENERIC.has(x.kn));

  const dir = path.join(ROOT, "content", "articles");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  // 무방향 인접 집합
  const adj = {};
  const addEdge = (a, b) => {
    (adj[a] = adj[a] || new Set()).add(b);
    (adj[b] = adj[b] || new Set()).add(a);
  };

  let edgeCount = 0;
  for (const f of files) {
    const selfId = f.replace(".json", "");
    const self = byId[selfId];
    if (!self) continue;
    let a;
    try { a = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
    const ko = a.locales?.ko;
    if (!ko) continue;
    const text = [ko.origin, ko.legend, ko.variants, ko.culture].filter(Boolean).join(" ");
    if (!text) continue;
    const srcTitle = norm(a.sourceTitle);

    for (const nm of names) {
      if (nm.id === selfId) continue;
      if (nm.cc !== self.cc) continue;            // ② 같은 나라만
      if (!text.includes(nm.kn)) continue;         // 본문 언급
      // ③ 중복 이표기 쌍 제외
      const nb = norm(nm.base);
      if (nb && srcTitle && (srcTitle.includes(nb) || nb.includes(srcTitle))) continue;
      if (nb && (nb.includes(norm(self.n.split("(")[0])) || norm(self.n.split("(")[0]).includes(nb))) continue;
      addEdge(selfId, nm.id);
      edgeCount++;
    }
  }

  // 출력: id -> [{id, n}] (이름순 정렬, 최대 8)
  const out = {};
  for (const id of Object.keys(adj)) {
    const neighbors = [...adj[id]]
      .map((nid) => ({ id: nid, n: byId[nid]?.n || nid }))
      .sort((a, b) => a.n.localeCompare(b.n))
      .slice(0, 8);
    if (neighbors.length) out[id] = neighbors;
  }

  const outPath = path.join(ROOT, "content", "tale-links.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + "\n");
  console.log(
    `tale-links: ${Object.keys(out).length}개 생물에 링크, 간선 ${edgeCount}개 → ${path.relative(ROOT, outPath)}`
  );
}

main();
