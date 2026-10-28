// Run: node scripts/test-writer-project.mjs
// TypeScript is already a project dependency; no build, server, or API is used.
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/writer-project.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { blankProject, checkProject, parseWorkspace, projectMarkdown, PROJECT_FIELDS, sourceRevision, sourceIsReviewed, importSourceWarnings, persistWriterWorkspace, prepareWorkspaceImport, WriterStorageConflict, MAX_WORKSPACE_BYTES, workspaceUtf8Bytes, assertWorkspaceFileSize } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const sources = JSON.parse(fs.readFileSync(new URL("../content/writer/sources.json", import.meta.url), "utf8")).sources;
const blank = blankProject();
assert.equal(checkProject(blank, sources).every((check) => !check.complete), true, "An empty project must not pass the checks");
assert.equal(blank.sequences.length, 5, "A project starts with five sequences");

const project = blankProject();
for (const key of PROJECT_FIELDS) project[key] = "검토한 초안";
project.sourceIds = [sources[0].id];
project.reviewedSourceIds = [sources[0].id];
project.sourceRevisions[sources[0].id] = sourceRevision(sources[0]);
project.sourceSnapshots[sources[0].id] = structuredClone(sources[0]);
project.sequences = project.sequences.map(() => ({ goal: "목표", obstacle: "장애", choice: "선택", consequence: "결과", causalityReviewed: true }));
assert.equal(checkProject(project, sources).every((check) => check.complete), true, "A completed and explicitly reviewed draft should pass the completeness checks");

project.sequences[0].consequence = " ";
assert.equal(checkProject(project, sources).find((check) => check.id === "causality").complete, false, "A checked box cannot hide a missing consequence");
assert.equal(checkProject(project, sources).find((check) => check.id === "sequences").complete, false, "Whitespace does not count as a consequence");
project.sourceIds.push("missing-source");
assert.equal(checkProject(project, sources).find((check) => check.id === "sources").complete, false, "Unknown source IDs cannot pass source review");

const workspace = { schemaVersion: 1, project, versions: [] };
assert.deepEqual(parseWorkspace(JSON.stringify(workspace)), workspace, "Save and load must preserve the draft");
assert.throws(() => parseWorkspace("{broken"), "Corrupt JSON must not become a blank project");
assert.throws(() => parseWorkspace(JSON.stringify({ ...workspace, schemaVersion: 2 })), "Unknown schema versions must be rejected");
assert.throws(() => parseWorkspace(JSON.stringify({ ...workspace, project: { ...project, sequences: [] } })), "Malformed sequences must be rejected");
assert.throws(() => parseWorkspace(JSON.stringify({ ...workspace, versions: Array(11).fill({ id: "v", name: "v", savedAt: "2026-10-24", project }) })), "A stored workspace exceeding the version cap must be rejected");

const markdown = projectMarkdown(project, sources);
assert.ok(markdown.includes(sources[0].references[0].url), "Export must retain the selected reference URL");
assert.ok(!markdown.includes(sources[1].references[0].url), "Export must not claim unused reference sources");
assert.ok(markdown.includes("AI 사용 기록"), "Export must keep the AI-use declaration field");
assert.ok(markdown.includes("자료 확인: 작성자가 이 보관 자료의 확인란 표시"), "Export must distinguish the writer's confirmation from automatic verification");

const changedSources = structuredClone(sources);
changedSources[0].summary = "나중에 수정된 해설";
assert.equal(sourceIsReviewed(project, changedSources[0]), false, "Review must not survive a source-content change under the same ID");
const historicalExport = projectMarkdown(project, changedSources);
assert.ok(historicalExport.includes(sources[0].summary), "An older draft must export its source snapshot");
assert.ok(!historicalExport.includes(changedSources[0].summary), "A current source must not replace the older draft's source content");
assert.ok(historicalExport.includes("현재 자료는 재확인 필요"), "Historical exports must identify a changed current source");
const legacy = structuredClone(workspace);
delete legacy.project.sourceRevisions;
delete legacy.project.sourceSnapshots;
const migrated = parseWorkspace(JSON.stringify(legacy));
assert.deepEqual(migrated.project.sourceRevisions, {}, "Legacy workspaces need an empty review-revision record");
assert.equal(sourceIsReviewed(migrated.project, sources[0]), false, "Legacy confirmation flags must not falsely confirm today's sources");
assert.deepEqual(importSourceWarnings(workspace, sources), ["missing-source"], "Unknown imported sources need an explicit warning");
const badSnapshot = structuredClone(workspace);
badSnapshot.project.sourceSnapshots[sources[0].id] = { id: sources[0].id };
assert.throws(() => parseWorkspace(JSON.stringify(badSnapshot)), "Malformed imported source snapshots must be rejected");

let stored = null;
let writes = 0;
const storage = { getItem() { return stored; }, setItem(_key, value) { stored = value; writes++; } };
const firstRaw = persistWriterWorkspace(storage, null, workspace);
assert.equal(writes, 1, "A first change is persisted");
persistWriterWorkspace(storage, firstRaw, workspace);
assert.equal(writes, 1, "Identical first-load data must not be written again");
stored = "another tab's saved draft";
assert.throws(() => persistWriterWorkspace(storage, firstRaw, workspace), WriterStorageConflict, "A changed stored value must reject a stale write even before a storage event arrives");
assert.equal(stored, "another tab's saved draft", "A stale writer must preserve the other tab's data");
const failingStorage = { getItem() { return firstRaw; }, setItem() { throw new Error("Quota exceeded"); } };
const changedWorkspace = structuredClone(workspace);
changedWorkspace.project.title = "저장되지 않은 수정";
assert.throws(() => persistWriterWorkspace(failingStorage, firstRaw, changedWorkspace), "Quota failures must propagate before React replaces the current draft");

const current = { schemaVersion: 1, project: { ...blankProject(), title: "지금 작성 중인 원고" }, versions: Array.from({ length: 9 }, (_, index) => ({ id: `old-${index}`, name: `기존 ${index}`, savedAt: "2026-10-24", project: blankProject() })) };
const incoming = { schemaVersion: 1, project: { ...blankProject(), title: "불러올 원고" }, versions: [{ id: "old-0", name: "가져온 버전", savedAt: "2026-10-23", project: blankProject() }] };
let nextId = 0;
const prepared = prepareWorkspaceImport(current, incoming, "2026-10-24T10:00:00.000Z", () => `new-${nextId++}`);
assert.equal(prepared.project.title, "불러올 원고", "An explicit import prepares the imported current draft");
assert.equal(prepared.versions[0].project.title, "지금 작성 중인 원고", "The previous current draft must always be preserved first");
assert.equal(prepared.versions.length, 10, "Merged versions respect the ten-version cap");
assert.equal(prepared.versions[1].name, "기존 0", "Existing versions have priority over imported versions");
assert.equal(new Set(prepared.versions.map((version) => version.id)).size, prepared.versions.length, "Imported and existing version IDs must not collide");
prepared.versions[0].project.title = "독립 복사 확인";
assert.equal(current.project.title, "지금 작성 중인 원고", "Preparing an import must not mutate the current workspace");
assert.equal(incoming.project.title, "불러올 원고", "Preparing an import must not mutate the imported file");
const substantialDraft = blankProject();
for (const key of ["protagonist", "desire", "opposition", "taboo", "stakes", "ending", "intent"]) substantialDraft[key] = "한".repeat(10000);
const substantialBackup = { schemaVersion: 1, project: substantialDraft, versions: Array.from({ length: 10 }, (_, index) => ({ id: `draft-${index}`, name: `초안 ${index}`, savedAt: "2026-10-24", project: structuredClone(substantialDraft) })) };
const substantialRaw = JSON.stringify(substantialBackup);
assert.ok(workspaceUtf8Bytes(substantialRaw) > 2 * 1024 * 1024, "A realistic Korean draft plus ten versions can exceed the old two-MB cap");
assert.doesNotThrow(() => assertWorkspaceFileSize(workspaceUtf8Bytes(substantialRaw)), "Normal complete backups above two MB must be eligible for import and export");
assert.deepEqual(parseWorkspace(substantialRaw), substantialBackup, "A complete backup above two MB must recover every draft and version");
assert.equal(workspaceUtf8Bytes("한글a"), 7, "The shared size check must measure UTF-8 bytes, not JavaScript string length");
assert.doesNotThrow(() => assertWorkspaceFileSize(MAX_WORKSPACE_BYTES), "The exact shared file-size limit must be accepted");
assert.throws(() => assertWorkspaceFileSize(MAX_WORKSPACE_BYTES + 1), "Both import and export must reject one byte above the shared limit");
assert.throws(() => assertWorkspaceFileSize(-1), "Invalid byte lengths must be rejected");
console.log("writer persistence, import, source-revision, export and size checks: 42 passed");
