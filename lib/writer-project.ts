export type WriterReference = { title: string; organization: string; url: string; accessed: string; note: string };
export type WriterSource = { id: string; title: string; subtitle: string; region: string; tradition: string; summary: string; verifiedFacts: string[]; creativeQuestions: string[]; references: WriterReference[]; rightsNote: string; verificationNote: string };
export type WriterSourceCatalog = { updatedAt: string; sources: WriterSource[] };
export type Sequence = { goal: string; obstacle: string; choice: string; consequence: string; causalityReviewed: boolean };
export const PROJECT_FIELDS = ["title", "protagonist", "desire", "opposition", "taboo", "irreversibleChoice", "stakes", "ending", "sourceFacts", "adaptation", "intent", "logline", "production", "rights", "aiUsage"] as const;
export type ProjectField = typeof PROJECT_FIELDS[number];
export type WriterProject = Record<ProjectField, string> & { sourceIds: string[]; reviewedSourceIds: string[]; sourceSnapshots: Record<string, WriterSource>; sourceRevisions: Record<string, string>; sequences: Sequence[]; updatedAt: string };
export type WriterVersion = { id: string; name: string; savedAt: string; project: WriterProject };
export type WriterWorkspace = { schemaVersion: 1; project: WriterProject; versions: WriterVersion[] };
export const MAX_WORKSPACE_BYTES = 20 * 1024 * 1024;
export const MAX_WORKSPACE_MB = MAX_WORKSPACE_BYTES / (1024 * 1024);
export function workspaceUtf8Bytes(text: string): number { return new TextEncoder().encode(text).byteLength; }
export function assertWorkspaceFileSize(bytes: number): void {
  if (!Number.isFinite(bytes) || bytes < 0 || bytes > MAX_WORKSPACE_BYTES) throw new Error(`작업실 JSON 보관 파일은 ${MAX_WORKSPACE_MB}MB 이하여야 합니다.`);
}
export class WriterStorageConflict extends Error { constructor() { super("다른 탭의 저장 내용이 먼저 변경되었습니다."); this.name = "WriterStorageConflict"; } }
export function persistWriterWorkspace(storage: Pick<Storage, "getItem" | "setItem">, expectedRaw: string | null, workspace: WriterWorkspace): string {
  const currentRaw = storage.getItem(WORKSPACE_KEY);
  if (currentRaw !== expectedRaw) throw new WriterStorageConflict();
  const nextRaw = JSON.stringify(workspace);
  if (currentRaw !== nextRaw) storage.setItem(WORKSPACE_KEY, nextRaw);
  return nextRaw;
}
export const WORKSPACE_KEY = "mythoria.writer.workspace.v1";
export const FIELD_LABELS: Record<ProjectField, string> = { title: "작품 제목", protagonist: "주인공", desire: "간절히 원하는 것", opposition: "막는 힘", taboo: "넘어서는 금기", irreversibleChoice: "되돌릴 수 없는 선택", stakes: "실패하면 잃는 것", ending: "결말의 변화", sourceFacts: "원전에서 가져올 사실과 근거", adaptation: "내가 바꾸거나 새로 만드는 것", intent: "기획 의도", logline: "로그라인", production: "형식과 제작 규모", rights: "권리 확인 기록", aiUsage: "AI 사용 기록" };
export const SEQUENCE_NAMES = ["흔들리는 일상", "첫 번째 경계", "선택의 대가", "돌아갈 수 없는 순간", "변화한 세계"];
export function blankProject(): WriterProject {
  return { title: "", protagonist: "", desire: "", opposition: "", taboo: "", irreversibleChoice: "", stakes: "", ending: "", sourceFacts: "", adaptation: "", intent: "", logline: "", production: "", rights: "", aiUsage: "", sourceIds: [], reviewedSourceIds: [], sourceSnapshots: {}, sourceRevisions: {}, sequences: Array.from({ length: 5 }, () => ({ goal: "", obstacle: "", choice: "", consequence: "", causalityReviewed: false })), updatedAt: "" };
}
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function isWriterSource(value: unknown): value is WriterSource {
  if (!isRecord(value)) return false;
  return ["id", "title", "subtitle", "region", "tradition", "summary", "rightsNote", "verificationNote"].every((key) => typeof value[key] === "string") && isStringArray(value.verifiedFacts) && isStringArray(value.creativeQuestions) && Array.isArray(value.references) && value.references.every((reference) => isRecord(reference) && ["title", "organization", "url", "accessed", "note"].every((key) => typeof reference[key] === "string"));
}
// Exact canonical content is used as the revision token, avoiding hash collisions.
export function sourceRevision(source: WriterSource): string {
  return JSON.stringify([source.id, source.title, source.subtitle, source.region, source.tradition, source.summary, source.verifiedFacts, source.creativeQuestions, source.references.map((reference) => [reference.title, reference.organization, reference.url, reference.accessed, reference.note]), source.rightsNote, source.verificationNote]);
}
export function sourceIsReviewed(project: WriterProject, source: WriterSource): boolean { return project.reviewedSourceIds.includes(source.id) && project.sourceRevisions[source.id] === sourceRevision(source); }
export function projectSources(project: WriterProject, sources: WriterSource[]): WriterSource[] {
  return project.sourceIds.flatMap((id) => { const source = Object.hasOwn(project.sourceSnapshots, id) ? project.sourceSnapshots[id] : sources.find((item) => item.id === id); return source ? [source] : []; });
}
export function isWriterProject(value: unknown): value is WriterProject {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return PROJECT_FIELDS.every((key) => typeof v[key] === "string") && typeof v.updatedAt === "string" && isStringArray(v.sourceIds) && isStringArray(v.reviewedSourceIds) && (v.sourceRevisions === undefined || (isRecord(v.sourceRevisions) && Object.values(v.sourceRevisions).every((revision) => typeof revision === "string"))) && (v.sourceSnapshots === undefined || (isRecord(v.sourceSnapshots) && Object.entries(v.sourceSnapshots).every(([id, snapshot]) => isWriterSource(snapshot) && snapshot.id === id))) && Array.isArray(v.sequences) && v.sequences.length === 5 && v.sequences.every((sequence) => sequence && typeof sequence === "object" && ["goal", "obstacle", "choice", "consequence"].every((key) => typeof sequence[key] === "string") && typeof sequence.causalityReviewed === "boolean");
}
export function parseWorkspace(raw: string): WriterWorkspace {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("저장 형식을 읽을 수 없습니다.");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1 || !isWriterProject(v.project) || !Array.isArray(v.versions) || v.versions.length > 10 || !v.versions.every((version) => version && typeof version === "object" && typeof version.id === "string" && typeof version.name === "string" && typeof version.savedAt === "string" && isWriterProject(version.project))) throw new Error("저장 형식이 현재 작업실과 맞지 않습니다.");
  const normalize = (project: WriterProject): WriterProject => ({ ...project, sourceSnapshots: project.sourceSnapshots ?? {}, sourceRevisions: project.sourceRevisions ?? {} });
  const parsed = value as WriterWorkspace;
  return { schemaVersion: 1, project: normalize(parsed.project), versions: parsed.versions.map((version) => ({ ...version, project: normalize(version.project) })) };
}
export function importSourceWarnings(workspace: WriterWorkspace, sources: WriterSource[]): string[] {
  const known = new Set(sources.map((source) => source.id));
  return [...new Set([workspace.project, ...workspace.versions.map((version) => version.project)].flatMap((project) => project.sourceIds.filter((id) => !known.has(id))))];
}
export function prepareWorkspaceImport(current: WriterWorkspace, incoming: WriterWorkspace, now: string, createId: () => string): WriterWorkspace {
  const preserved: WriterVersion = { id: createId(), name: "파일 불러오기 전 현재 글", savedAt: now, project: structuredClone(current.project) };
  const merged = [...current.versions.map((version) => ({ ...structuredClone(version), id: createId() })), ...incoming.versions.map((version) => ({ ...structuredClone(version), id: createId(), name: `가져옴 · ${version.name}` }))];
  // Current draft is always retained. Existing versions take priority over
  // imported versions; the UI previews the number excluded by the ten-version cap.
  return { schemaVersion: 1, project: { ...structuredClone(incoming.project), updatedAt: now }, versions: [preserved, ...merged].slice(0, 10) };
}
export type WriterCheck = { id: string; label: string; detail: string; complete: boolean; target: string };
export function checkProject(project: WriterProject, sources: WriterSource[]): WriterCheck[] {
  const knownSources = new Set(sources.map((source) => source.id));
  const selectedKnown = project.sourceIds.filter((id) => knownSources.has(id));
  const missingCore = (["title", "protagonist", "desire", "opposition", "taboo", "irreversibleChoice", "stakes", "ending"] as ProjectField[]).filter((key) => !project[key].trim());
  const emptySequences = project.sequences.flatMap((sequence, index) => ["goal", "obstacle", "choice", "consequence"].some((key) => !(sequence[key as keyof Sequence] as string).trim()) ? [index + 1] : []);
  const uncheckedSequences = project.sequences.flatMap((sequence, index) => !sequence.causalityReviewed ? [index + 1] : []);
  const packetMissing = (["intent", "logline", "production", "rights", "aiUsage"] as ProjectField[]).filter((key) => !project[key].trim());
  return [
    { id: "sources", label: "출처 선택과 직접 확인", complete: selectedKnown.length > 0 && selectedKnown.length === project.sourceIds.length && sources.filter((source) => selectedKnown.includes(source.id)).every((source) => sourceIsReviewed(project, source)), detail: "자료를 하나 이상 선택하고, 현재 자료 내용에 대한 출처 확인란을 직접 표시합니다. 자료가 바뀌면 다시 확인해야 합니다. 원문 전체 검증이나 권리 허락을 자동 보증하지 않습니다.", target: "sources" },
    { id: "boundary", label: "자료와 창작의 경계", complete: !!project.sourceFacts.trim() && !!project.adaptation.trim(), detail: "원전 근거와 새로 만든 설정을 각각 기록했는지 확인합니다.", target: "boundaries" },
    { id: "core", label: "이야기의 중심", complete: missingCore.length === 0, detail: missingCore.length ? `비어 있는 항목: ${missingCore.map((key) => FIELD_LABELS[key]).join(", ")}` : "중심 항목 8개가 작성되었습니다. 내용의 독창성이나 완성도를 판정한 결과는 아닙니다.", target: "story" },
    { id: "sequences", label: "다섯 시퀀스의 사건", complete: emptySequences.length === 0, detail: emptySequences.length ? `목표·장애·선택·결과가 빠진 시퀀스: ${emptySequences.join(", ")}` : "다섯 시퀀스의 목표·장애·선택·결과가 모두 작성되었습니다.", target: "sequences" },
    { id: "causality", label: "선택과 결과의 인과", complete: uncheckedSequences.length === 0 && emptySequences.length === 0, detail: uncheckedSequences.length ? `작성자가 인과를 직접 확인하지 않은 시퀀스: ${uncheckedSequences.join(", ")}. 문장의 인과를 자동으로 판단하지 않습니다.` : "작성자가 인과 확인란을 표시했습니다. 이 도구의 내용 심사나 AI 평가가 아닙니다.", target: "sequences" },
    { id: "packet", label: "기획 문서 준비", complete: packetMissing.length === 0, detail: packetMissing.length ? `기록할 항목: ${packetMissing.map((key) => FIELD_LABELS[key]).join(", ")}` : "기획 항목이 작성되었습니다. 지원사업의 지정 양식·자격·분량·AI 규정은 해당 공고에서 별도로 확인해야 합니다.", target: "packet" },
  ];
}
export function projectMarkdown(project: WriterProject, sources: WriterSource[]): string {
  const value = (text: string) => text.trim() || "(미작성)";
  const selected = projectSources(project, sources);
  return [`# ${value(project.title)}`, "설화 작업실에서 작성한 창작 기획 초안. 원전의 정본이나 지원사업 제출 완료 문서가 아닙니다.", `마지막 편집: ${project.updatedAt || "기록 없음"}`, "## 출처", ...selected.map((source) => [`### ${source.title}`, source.summary, `자료 확인: ${sourceIsReviewed(project, source) ? "작성자가 이 보관 자료의 확인란 표시" : "미확인"}`, `자료 버전: ${project.sourceSnapshots[source.id] ? "원고에 보관된 자료" : "과거 자료 사본 없음 · 현재 목록 참고"}${sources.find((item) => item.id === source.id) && sourceRevision(sources.find((item) => item.id === source.id)!) !== sourceRevision(source) ? " · 현재 자료와 내용이 다릅니다. 현재 자료는 재확인 필요" : ""}`, "자료에서 확인한 내용:", ...source.verifiedFacts.map((fact) => `- ${fact}`), ...source.references.map((reference) => `- [${reference.title}](${reference.url}) — ${reference.organization}, 확인일 ${reference.accessed}. ${reference.note}`), `권리 참고: ${source.rightsNote}`, `검토 범위: ${source.verificationNote}`].join("\n\n")), "## 원전과 창작", ...(["sourceFacts", "adaptation"] as ProjectField[]).map((key) => `### ${FIELD_LABELS[key]}\n\n${value(project[key])}`), "## 이야기의 중심", ...(["protagonist", "desire", "opposition", "taboo", "irreversibleChoice", "stakes", "ending"] as ProjectField[]).map((key) => `### ${FIELD_LABELS[key]}\n\n${value(project[key])}`), "## 다섯 시퀀스", ...project.sequences.map((sequence, index) => `### ${index + 1}. ${SEQUENCE_NAMES[index]}\n\n목표: ${value(sequence.goal)}\n\n장애: ${value(sequence.obstacle)}\n\n선택: ${value(sequence.choice)}\n\n결과: ${value(sequence.consequence)}\n\n인과 직접 확인: ${sequence.causalityReviewed ? "작성자가 확인란 표시" : "미확인"}`), "## 기획 문서", ...(["intent", "logline", "production", "rights", "aiUsage"] as ProjectField[]).map((key) => `### ${FIELD_LABELS[key]}\n\n${value(project[key])}`), "## 작성 점검", ...checkProject(project, sources).map((check) => `- [${check.complete ? "x" : " "}] ${check.label}: ${check.detail}`), "이 작업실은 AI 생성 API를 호출하지 않습니다. 사용자가 외부 AI를 활용했다면 AI 사용 기록에 직접 남깁니다."].join("\n\n");
}
