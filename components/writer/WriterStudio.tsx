"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { assertWorkspaceFileSize, MAX_WORKSPACE_MB, workspaceUtf8Bytes, blankProject, checkProject, FIELD_LABELS, importSourceWarnings, parseWorkspace, persistWriterWorkspace, prepareWorkspaceImport, projectMarkdown, projectSources, sourceIsReviewed, sourceRevision, SEQUENCE_NAMES, WORKSPACE_KEY, WriterStorageConflict, type ProjectField, type Sequence, type WriterProject, type WriterSource, type WriterSourceCatalog, type WriterVersion, type WriterWorkspace } from "@/lib/writer-project";
import styles from "./WriterStudio.module.css";

const prompts: Record<ProjectField, string> = {
  title: "아직 가제여도 괜찮습니다.", protagonist: "누가 가장 큰 대가를 치르게 되나요? 직업보다 결핍과 관계를 적어보세요.", desire: "이 사람이 지금 반드시 이루려는 구체적인 목표는?", opposition: "목표를 막는 사람, 제도, 존재, 내적 모순은?", taboo: "넘지 말아야 할 경계는 무엇이고, 왜 넘게 되나요?", irreversibleChoice: "사건에 떠밀리는 대신 주인공이 직접 저지르는 선택은?", stakes: "실패의 대가를 관계·신체·신념·공동체 중 구체적으로 적습니다.", ending: "첫 장면과 비교해 무엇이 달라지고, 무엇은 되돌릴 수 없나요?", sourceFacts: "예: 자료명과 항목, 직접 확인한 대목, 이본에서 달라지는 점. 직접 인용은 분량과 이용 조건도 기록합니다.", adaptation: "원전과 달라지는 시대·인물·규칙·결말을 적습니다. 이 항목은 창작 가설이며 전승 사실로 취급하지 않습니다.", intent: "왜 지금 이 설화를 이야기하나요? 어떤 사람의 어떤 질문에 닿고 싶은가요?", logline: "어떤 주인공이, 어떤 사건 이후, 무엇을 이루려 하지만, 무엇 때문에 어떤 대가를 치르게 되는가.", production: "예: 20분 단편 / 주요 인물 3명 / 실내 2곳 / 야간 촬영 1회 / 존재 표현은 소리와 그림자. 실제 예산은 별도 산출합니다.", rights: "원문·현대 번역·사진·삽화·각색 각각의 권리자, 이용 조건, 확인 URL/날짜, 허락 필요 여부를 기록합니다. 설화가 오래되었다고 현대 자료까지 자유 이용인 것은 아닙니다.", aiUsage: "사용하지 않았다면 ‘사용하지 않음’. 사용했다면 도구/모델, 날짜, 적용 부분, 사람이 수정·검토한 범위를 기록합니다. 지원사업별 AI 규정은 공고에서 확인합니다.",
};
function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function stamp(value: string) { return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "저장 시각 없음"; }
function makeVersion(project: WriterProject, name: string): WriterVersion {
  return { id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), project: structuredClone(project) };
}
function Field({ field, project, ready, update }: { field: ProjectField; project: WriterProject; ready: boolean; update: (field: ProjectField, value: string) => void }) {
  return <div className={styles.field}><label htmlFor={`field-${field}`}>{FIELD_LABELS[field]}</label><p id={`hint-${field}`}>{prompts[field]}</p>{field === "title" ? <input id={`field-${field}`} value={project[field]} onChange={(event) => update(field, event.target.value)} disabled={!ready} maxLength={200} aria-describedby={`hint-${field}`} /> : <textarea id={`field-${field}`} value={project[field]} onChange={(event) => update(field, event.target.value)} disabled={!ready} rows={field === "intent" || field === "rights" ? 5 : 3} maxLength={15000} aria-describedby={`hint-${field}`} />}</div>;
}

export default function WriterStudio({ catalog, children }: { catalog: WriterSourceCatalog; children?: ReactNode }) {
  const [project, setProject] = useState<WriterProject>(blankProject);
  const [versions, setVersions] = useState<WriterVersion[]>([]);
  const [ready, setReady] = useState(false);
  const [storageAllowed, setStorageAllowed] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [notice, setNotice] = useState("");
  const [rawBackup, setRawBackup] = useState("");
  const [versionName, setVersionName] = useState("");
  const lastPersistedRaw = useRef<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{ workspace: WriterWorkspace; filename: string; unknownSources: string[] } | null>(null);
  const [importError, setImportError] = useState("");
  const [importReading, setImportReading] = useState(false);
  const [importCapAcknowledged, setImportCapAcknowledged] = useState(false);
  const importReadId = useRef(0);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(WORKSPACE_KEY);
      lastPersistedRaw.current = raw;
      if (raw) { const restored = parseWorkspace(raw); setProject(restored.project); setVersions(restored.versions); setSavedAt(restored.project.updatedAt); }
      setStorageAllowed(true);
    } catch {
      if (raw) setRawBackup(raw);
      setStorageError("기존 저장 내용을 읽지 못했습니다. 기존 데이터는 덮어쓰지 않습니다. 지금 쓰는 내용은 JSON으로 내보내 보관하세요. 자동 저장과 버전 저장은 멈춰 있습니다.");
    }
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSPACE_KEY || event.key === null) {
        setStorageAllowed(false);
        setStorageError("다른 탭에서 저장 내용이 바뀌었습니다. 충돌을 막기 위해 이 탭의 자동 저장을 멈췄습니다. 현재 글을 JSON으로 내보낸 뒤 페이지를 다시 열어주세요.");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready || !storageAllowed || !project.updatedAt) return;
    try { lastPersistedRaw.current = persistWriterWorkspace(localStorage, lastPersistedRaw.current, { schemaVersion: 1, project, versions }); setSavedAt(project.updatedAt); }
    catch (error) { setStorageAllowed(false); setStorageError(error instanceof WriterStorageConflict ? "다른 탭의 내용이 먼저 저장되었습니다. 덮어쓰지 않고 이 탭의 자동 저장을 멈췄습니다. 현재 글을 JSON으로 내보내 보관하세요." : "브라우저가 저장을 허용하지 않거나 저장 공간이 부족합니다. 현재 글은 화면에 남아 있습니다. 페이지를 닫기 전에 Markdown 또는 JSON으로 내보내세요."); }
  }, [ready, storageAllowed, project, versions]);

  function change(changeProject: (current: WriterProject) => WriterProject) {
    setProject((current) => ({ ...changeProject(current), updatedAt: new Date().toISOString() }));
  }
  function update(field: ProjectField, value: string) { change((current) => ({ ...current, [field]: value })); }
  function toggleSource(id: string) {
    const source = catalog.sources.find((item) => item.id === id);
    change((current) => ({ ...current, sourceIds: current.sourceIds.includes(id) ? current.sourceIds.filter((sourceId) => sourceId !== id) : [...current.sourceIds, id], reviewedSourceIds: current.reviewedSourceIds.filter((sourceId) => sourceId !== id), sourceSnapshots: source ? { ...current.sourceSnapshots, [id]: structuredClone(source) } : current.sourceSnapshots }));
    setNotice("선택 자료만 바뀌었습니다. 작성한 이야기와 시퀀스는 그대로 유지됩니다.");
  }
  function reviewSource(source: WriterSource, checked: boolean) {
    change((current) => ({ ...current, reviewedSourceIds: checked ? [...new Set([...current.reviewedSourceIds, source.id])] : current.reviewedSourceIds.filter((id) => id !== source.id), sourceSnapshots: checked ? { ...current.sourceSnapshots, [source.id]: structuredClone(source) } : current.sourceSnapshots, sourceRevisions: checked ? { ...current.sourceRevisions, [source.id]: sourceRevision(source) } : current.sourceRevisions }));
  }
  function sequenceChange(index: number, key: keyof Sequence, value: string | boolean) {
    change((current) => ({ ...current, sequences: current.sequences.map((sequence, i) => i === index ? { ...sequence, [key]: value, causalityReviewed: key === "causalityReviewed" ? Boolean(value) : false } : sequence) }));
  }
  function persistVersions(nextVersions: WriterVersion[], nextProject = project) {
    try {
      lastPersistedRaw.current = persistWriterWorkspace(localStorage, lastPersistedRaw.current, { schemaVersion: 1, project: nextProject, versions: nextVersions });
      setVersions(nextVersions); setProject(nextProject); setSavedAt(nextProject.updatedAt); return true;
    } catch (error) { setStorageAllowed(false); setStorageError(error instanceof WriterStorageConflict ? "다른 탭의 내용이 먼저 저장되었습니다. 이 탭의 원고와 버전을 유지하고 저장을 멈췄습니다. 현재 글을 내보내 보관하세요." : "버전을 저장하지 못했습니다. 현재 글을 내보내 보관하세요. 기존 버전과 현재 글은 바꾸지 않았습니다."); return false; }
  }
  function saveVersion() {
    if (!storageAllowed || !ready) return;
    const version = makeVersion(project, versionName.trim() || project.title.trim() || "이름 없는 초안");
    if (persistVersions([version, ...versions].slice(0, 10))) { setVersionName(""); setNotice(`‘${version.name}’ 버전을 저장했습니다.`); }
  }
  function restoreVersion(version: WriterVersion) {
    if (!storageAllowed || !ready) return;
    const backup = makeVersion(project, "버전 열기 전 현재 글");
    const restored = { ...structuredClone(version.project), updatedAt: new Date().toISOString() };
    if (persistVersions([backup, ...versions].slice(0, 10), restored)) setNotice(`현재 글을 ‘버전 열기 전 현재 글’로 보관하고 ‘${version.name}’을 열었습니다.`);
  }
  function exportProject(format: "md" | "json") {
    try {
      const name = (project.title.trim() || "설화-기획초안").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").slice(0, 80);
      const content = format === "md" ? projectMarkdown(project, catalog.sources) : JSON.stringify({ schemaVersion: 1, project, versions, sourceCatalog: { updatedAt: catalog.updatedAt, sources: projectSources(project, catalog.sources) } }, null, 2);
      if (format === "json") {
        try { assertWorkspaceFileSize(workspaceUtf8Bytes(content)); }
        catch { setNotice(`JSON 보관 파일이 ${MAX_WORKSPACE_MB}MB를 넘어서 내보내기를 중단했습니다. 이 크기의 파일은 작업실에서 복구할 수 없습니다. 현재 원고와 버전은 그대로 유지됩니다. Markdown 원고를 먼저 내보내 보관하세요.`); return; }
      }
      downloadText(content, `${name}-${new Date().toISOString().slice(0, 10)}.${format}`, format === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8");
      setNotice(`${format === "md" ? "Markdown" : "JSON"} 다운로드를 요청했습니다. 브라우저 다운로드 목록에서 파일을 확인하세요.`);
    } catch { setNotice("파일을 만들지 못했습니다. 입력 내용은 그대로 유지됩니다. 필요한 글을 복사해 별도로 보관하세요."); }
  }
  async function readImport(file: File | undefined) {
    const requestId = ++importReadId.current;
    setPendingImport(null); setImportError(""); setImportCapAcknowledged(false);
    if (!file) return;
    try { assertWorkspaceFileSize(file.size); }
    catch { setImportError(`${MAX_WORKSPACE_MB}MB 이하의 작업실 JSON 파일만 읽을 수 있습니다. 현재 원고는 바꾸지 않았습니다.`); return; }
    setImportReading(true);
    try {
      const raw = await file.text();
      assertWorkspaceFileSize(workspaceUtf8Bytes(raw));
      const workspace = parseWorkspace(raw);
      if (requestId !== importReadId.current) return;
      setPendingImport({ workspace, filename: file.name, unknownSources: importSourceWarnings(workspace, catalog.sources) });
    } catch { if (requestId === importReadId.current) setImportError("이 파일을 작업실 보관 파일로 읽을 수 없습니다. JSON 문법·저장 버전·필수 항목을 확인하세요. 현재 원고와 저장 내용은 바꾸지 않았습니다."); }
    finally { if (requestId === importReadId.current) setImportReading(false); }
  }
  function applyImport() {
    if (!ready || !storageAllowed || !pendingImport || pendingImport.unknownSources.length || (versions.length + pendingImport.workspace.versions.length + 1 > 10 && !importCapAcknowledged)) return;
    const merged = prepareWorkspaceImport({ schemaVersion: 1, project, versions }, pendingImport.workspace, new Date().toISOString(), () => crypto.randomUUID());
    if (persistVersions(merged.versions, merged.project)) { setNotice(`‘${pendingImport.filename}’의 원고를 불러왔습니다. 이전 원고는 ‘파일 불러오기 전 현재 글’ 버전에 보관했습니다.`); setPendingImport(null); }
  }
  const checks = checkProject(project, catalog.sources);
  const selection = catalog.sources.filter((source) => project.sourceIds.includes(source.id));
  const excludedImportVersions = pendingImport ? Math.max(0, 1 + versions.length + pendingImport.workspace.versions.length - 10) : 0;

  return <div className={styles.page} lang="ko">
    <a className={styles.skip} href="#studio-main">작업실 본문으로 이동</a>
    <header className={styles.header}><Link href="/">MYTHORIA <span>설화 작업실</span></Link><nav aria-label="작업실 메뉴"><Link href="/ko/creatures/country/kr">한국 도감</Link><Link href="/ko/guides/korean-folklore">설화 가이드</Link></nav></header>
    <main id="studio-main" className={styles.main}>
      <section className={styles.hero}><div><p className={styles.eyebrow}>WRITER’S DESK / 첫 번째 작업실</p><h1>오래된 이야기에서,<br />지금의 선택을 쓰다.</h1><p className={styles.lede}>출처를 읽고, 주인공이 치를 대가를 정하고, 다섯 번의 선택으로 이야기를 움직입니다. 설화 조사에서 기획 문서까지 이어지는 작가의 노트입니다.</p></div><aside className={styles.heroNote}><span>이곳의 글은</span><strong>당신이 씁니다.</strong><p>빈칸을 채우는 AI 자동 생성 기능은 아직 없습니다. 전승 자료와 창작을 구분하며 직접 쓰고, 작성 상태를 점검하는 작업실입니다.</p></aside></section>
      <div className={styles.storageNote}><strong>이 브라우저에 자동 저장</strong><p>입력한 글은 이 작업실에서 서버로 전송하지 않습니다. 저장 내용은 암호화되지 않으며, 다른 기기와 동기화되지 않습니다. 브라우저 데이터 삭제·공용 기기 사용에 주의하고, 중요한 초안은 파일로 내보내 보관하세요. 저장 전 다른 탭의 변경을 확인하지만 동시 편집을 완전히 보장하지는 않으므로 한 탭에서 작업하세요.</p><span role="status">{!ready ? "저장 내용을 불러오는 중…" : storageAllowed ? savedAt ? `마지막 편집 저장: ${stamp(savedAt)}` : "첫 글을 쓰면 자동 저장됩니다." : "자동 저장 중지 — 파일 내보내기로 보관하세요."}</span></div>
      {storageError && <div className={styles.error} role="alert"><p>{storageError}</p>{rawBackup && <button type="button" onClick={() => downloadText(rawBackup, "설화작업실-기존저장-복구원본.txt", "text/plain;charset=utf-8")}>읽지 못한 기존 데이터 내보내기</button>}</div>}
      <nav className={styles.steps} aria-label="작성 단계"><a href="#sources">01 자료</a><a href="#boundaries">02 경계</a><a href="#story">03 갈등</a><a href="#sequences">04 시퀀스</a><a href="#packet">05 기획</a><a href="#review">06 점검·내보내기</a></nav>
      <div className={styles.notice} role="status" aria-live="polite">{notice}</div>

      <section id="sources" className={styles.section}><div className={styles.sectionHeading}><p>01 / 출처를 고르다</p><h2>어떤 이야기에서<br />출발하나요?</h2><span>자료 확인 {catalog.updatedAt} · 자료 선택을 바꿔도 작성한 글은 유지됩니다.</span></div><div className={styles.sourceGrid}>{catalog.sources.map((source, index) => { const selected = project.sourceIds.includes(source.id); return <article className={`${styles.sourceCard} ${selected ? styles.selected : ""}`} key={source.id}><div className={styles.sourceTop}><span>{String(index + 1).padStart(2, "0")}</span><label><input type="checkbox" checked={selected} onChange={() => toggleSource(source.id)} disabled={!ready} />이 자료 사용</label></div><p className={styles.meta}>{source.region} · {source.tradition}</p><h3>{source.title}</h3><p className={styles.subtitle}>{source.subtitle}</p><p>{source.summary}</p><details><summary>자료에서 확인한 내용과 출처</summary><h4>자료에서 확인한 내용</h4><ul>{source.verifiedFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul><p className={styles.small}>{source.verificationNote}</p><h4>창작을 위한 질문 <span>편집 제안</span></h4><ul>{source.creativeQuestions.map((question) => <li key={question}>{question}</li>)}</ul><h4>출처</h4>{source.references.map((reference) => <div className={styles.reference} key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗<span className={styles.srOnly}> (새 탭)</span></a><p>{reference.organization} · 확인일 {reference.accessed}</p><p>{reference.note}</p></div>)}<p className={styles.rights}>{source.rightsNote}</p></details>{selected && project.reviewedSourceIds.includes(source.id) && !sourceIsReviewed(project, source) && <p className={styles.changedSource}>자료 내용이 바뀌었거나 과거 확인 버전이 없습니다. 현재 자료를 다시 읽어 확인하세요. 내보내기에는 원고에 보관된 자료를 사용합니다.</p>}{selected && <label className={styles.reviewCheck}><input type="checkbox" checked={sourceIsReviewed(project, source)} onChange={(event) => reviewSource(source, event.target.checked)} />연결된 자료를 직접 읽었습니다. 확인한 범위는 아래에 따로 기록합니다.</label>}</article>; })}</div></section>

      <section id="boundaries" className={styles.section}><div className={styles.sectionHeading}><p>02 / 경계를 남기다</p><h2>전해진 것과,<br />새로 만드는 것.</h2><span>{selection.length ? `선택한 자료: ${selection.map((source) => source.title).join(" · ")}` : "위에서 출발 자료를 먼저 선택하세요."}</span></div><div className={styles.twoColumns}><Field field="sourceFacts" project={project} ready={ready} update={update} /><Field field="adaptation" project={project} ready={ready} update={update} /></div></section>

      <section id="story" className={styles.section}><div className={styles.sectionHeading}><p>03 / 갈등을 세우다</p><h2>무엇을 얻기 위해,<br />무엇을 잃나요?</h2><span>이름이나 능력보다 선택과 대가가 이야기를 움직입니다.</span></div><Field field="title" project={project} ready={ready} update={update} /><div className={styles.twoColumns}>{(["protagonist", "desire", "opposition", "taboo", "irreversibleChoice", "stakes", "ending"] as ProjectField[]).map((field) => <Field key={field} field={field} project={project} ready={ready} update={update} />)}</div></section>

      <section id="sequences" className={styles.section}><div className={styles.sectionHeading}><p>04 / 선택을 연결하다</p><h2>다섯 번의 선택.<br />다섯 번의 변화.</h2><span>아래 이름은 작성용 안내입니다. 사건을 자유롭게 구성하세요. 내용을 수정하면 해당 인과 확인 표시가 해제됩니다.</span></div><div className={styles.sequenceList}>{project.sequences.map((sequence, index) => <fieldset className={styles.sequence} key={index}><legend><span>0{index + 1}</span> {SEQUENCE_NAMES[index]}</legend><div className={styles.twoColumns}>{([{ key: "goal", label: "이번에 이루려는 목표", hint: "직전 결과 때문에 새로 생긴 목표는?" }, { key: "obstacle", label: "목표를 막는 장애", hint: "기존 방식이 통하지 않는 이유는?" }, { key: "choice", label: "주인공의 선택", hint: "실제로 무엇을 하거나 포기하나요?" }, { key: "consequence", label: "그 선택이 만든 결과", hint: "그 행동 때문에 무엇이 달라지고 다음 사건이 시작되나요?" }] as const).map(({ key, label, hint }) => <div className={styles.field} key={key}><label htmlFor={`seq-${index}-${key}`}>{label}</label><p id={`seq-hint-${index}-${key}`}>{hint}</p><textarea id={`seq-${index}-${key}`} value={sequence[key]} onChange={(event) => sequenceChange(index, key, event.target.value)} rows={3} maxLength={10000} disabled={!ready} aria-describedby={`seq-hint-${index}-${key}`} /></div>)}</div><label className={styles.reviewCheck}><input type="checkbox" checked={sequence.causalityReviewed} onChange={(event) => sequenceChange(index, "causalityReviewed", event.target.checked)} disabled={!ready || !sequence.goal.trim() || !sequence.obstacle.trim() || !sequence.choice.trim() || !sequence.consequence.trim()} />주인공의 선택이 이 결과를 일으키는지 직접 확인했습니다.</label></fieldset>)}</div></section>

      <section id="packet" className={styles.section}><div className={styles.sectionHeading}><p>05 / 기획으로 묶다</p><h2>다른 사람이 읽을 수 있는<br />기획 문서로.</h2><span>여기서는 기획 초안을 정리합니다. 지원사업 자격·분량·제출 양식·AI 이용 기준은 해당 연도 공고에 맞춰 따로 검토해야 합니다.</span></div>{(["intent", "logline", "production", "rights", "aiUsage"] as ProjectField[]).map((field) => <Field key={field} field={field} project={project} ready={ready} update={update} />)}</section>

      {children}

      <section id="review" className={styles.section}><div className={styles.sectionHeading}><p>06 / 점검하고 보관하다</p><h2>초안이 남도록.</h2><span>작성 여부와 직접 확인 표시를 점검합니다. 작품 점수, 당선 확률, 이야기의 인과를 AI가 판정하는 기능은 아닙니다.</span></div><ul className={styles.checks}>{checks.map((check) => <li key={check.id}><span className={check.complete ? styles.done : styles.pending}>{check.complete ? "기록됨" : "확인 필요"}</span><div><a href={`#${check.target}`}>{check.label}</a><p>{check.detail}</p></div></li>)}</ul><div className={styles.export}><div><h3>파일로 내보내기</h3><p>Markdown에는 선택 자료와 기획 초안이, JSON에는 현재 초안·저장 버전·선택 자료가 담깁니다. 파일 저장 여부는 브라우저 다운로드 목록에서 확인하세요.</p></div><div className={styles.actions}><button className={styles.primary} onClick={() => exportProject("md")} disabled={!ready}>기획 초안 .md ↓</button><button className={styles.secondary} onClick={() => exportProject("json")} disabled={!ready}>보관 파일 .json ↓</button></div></div><div className={styles.importBox}><h3>보관 파일 불러오기</h3><p>이 작업실에서 내보낸 {MAX_WORKSPACE_MB}MB 이하의 JSON 파일을 선택하세요. 미리보기를 확인하고 직접 적용하기 전까지 원고는 바뀌지 않습니다. 저장이 중지된 상태에서는 파일을 읽기만 합니다.</p><label htmlFor="import-workspace">JSON 보관 파일</label><input id="import-workspace" type="file" accept=".json,application/json" disabled={!ready || importReading} onChange={(event) => { const file = event.target.files?.[0]; void readImport(file); event.target.value = ""; }} />{importReading && <p role="status">파일을 읽는 중…</p>}{importError && <p className={styles.importError} role="alert">{importError}</p>}{pendingImport && <div className={styles.importPreview}><h4>불러올 원고 미리보기</h4><dl><dt>파일</dt><dd>{pendingImport.filename}</dd><dt>제목</dt><dd>{pendingImport.workspace.project.title || "제목 없음"}</dd><dt>마지막 편집</dt><dd>{stamp(pendingImport.workspace.project.updatedAt)}</dd><dt>담긴 버전</dt><dd>{pendingImport.workspace.versions.length}개</dd></dl>{pendingImport.unknownSources.length > 0 && <p className={styles.importError} role="alert">현재 자료 목록에 없는 출처가 포함되어 적용할 수 없습니다: {pendingImport.unknownSources.join(", ")}. 이 파일은 그대로 보관하세요. 현재 원고는 유지됩니다.</p>}<p>현재 원고를 ‘파일 불러오기 전 현재 글’로 먼저 보관한 뒤 기존 버전, 가져온 버전 순서로 최대 10개를 유지합니다.</p>{excludedImportVersions > 0 && <label className={styles.reviewCheck}><input type="checkbox" checked={importCapAcknowledged} onChange={(event) => setImportCapAcknowledged(event.target.checked)} />10개 상한으로 기존 버전 {Math.max(0, versions.length - 9)}개와 가져온 버전 {Math.max(0, pendingImport.workspace.versions.length - Math.max(0, 9 - versions.length))}개가 제외됨을 확인했습니다. 필요한 버전은 적용 전에 현재 JSON을 내보내 보관합니다.</label>}{!storageAllowed && <p className={styles.importError}>자동 저장이 중지되어 미리보기만 가능합니다. 현재 원고를 바꾸지 않습니다.</p>}<div className={styles.actions}><button className={styles.primary} type="button" disabled={!storageAllowed || !!pendingImport.unknownSources.length || (excludedImportVersions > 0 && !importCapAcknowledged)} onClick={applyImport}>현재 글 보관 후 이 원고 불러오기</button><button className={styles.secondary} type="button" onClick={() => setPendingImport(null)}>미리보기 닫기</button></div></div>}</div><div className={styles.versions}><h3>이 지점에서 버전 남기기</h3><p>최근 10개만 이 브라우저에 보관합니다. 11번째부터 가장 오래된 버전이 빠집니다. 버전을 열면 현재 글을 먼저 새 버전으로 보관합니다. 오래 남길 버전은 JSON으로 내보내세요.</p><div className={styles.versionForm}><label htmlFor="version-name" className={styles.srOnly}>버전 이름</label><input id="version-name" value={versionName} onChange={(event) => setVersionName(event.target.value)} placeholder="예: 구미호 — 결말 바꾸기 전" maxLength={100} disabled={!ready || !storageAllowed} /><button className={styles.secondary} onClick={saveVersion} disabled={!ready || !storageAllowed}>현재 버전 저장</button></div>{versions.length > 0 ? <ol>{versions.map((version) => <li key={version.id}><div><strong>{version.name}</strong><span>{stamp(version.savedAt)}</span></div><button type="button" onClick={() => restoreVersion(version)} disabled={!ready || !storageAllowed} aria-label={`${version.name} 버전 열기`}>열기 ↗</button></li>)}</ol> : <p className={styles.small}>아직 저장한 버전이 없습니다. 자동 저장과 별도로 중요한 지점을 남겨두세요.</p>}</div></section>
    </main><footer className={styles.footer}><Link href="/">Global Folklore Bestiary</Link><p>전승의 출처를 남기고, 창작의 선택을 기록합니다.</p><a href="#studio-main">맨 위로 ↑</a></footer>
  </div>;
}
