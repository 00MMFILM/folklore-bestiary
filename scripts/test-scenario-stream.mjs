import assert from "node:assert/strict";
import { readScenarioStream, parseScenarioText, selectScenarioBeings } from "../lib/scenario-stream.ts";

const encoder = new TextEncoder();
const event = (content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
const stream = (chunks) => new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } });
const bytes = encoder.encode(event("설화의 선택 🐉") + "data: [DONE]\n\n");

// Every possible network split includes splits within JSON and UTF-8 characters.
for (let split = 1; split < bytes.length; split++) {
  assert.equal(await readScenarioStream(stream([bytes.slice(0, split), bytes.slice(split)])), "설화의 선택 🐉");
}
assert.equal(await readScenarioStream(stream(Array.from(bytes, (byte) => Uint8Array.of(byte)))), "설화의 선택 🐉");

const updates = [];
const crlf = (": heartbeat\n\n" + event("하나") + event("둘") + "data: [DONE]\n\n" + event("무시")).replaceAll("\n", "\r\n");
assert.equal(await readScenarioStream(stream([encoder.encode(crlf)]), (text) => updates.push(text)), "하나둘");
assert.deepEqual(updates, ["하나", "하나둘"]);

for (const [payload, pattern] of [
  [event("partial"), /incomplete/i],
  ["data: [DONE]\n\n", /empty/i],
  ["data: {broken}\n\ndata: [DONE]\n\n", /invalid/i],
  ['data: {"error":{"message":"quota exceeded"}}\n\n', /upstream/i],
  ['event: error\ndata: {"message":"failed"}\n\n', /upstream/i],
  [event("partial") + 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n', /truncated/i],
]) {
  await assert.rejects(() => readScenarioStream(stream([encoder.encode(payload)])), pattern);
}

const result = { title: "쇠를 먹는 약속", acts: Array.from({ length: 4 }, (_, act) => ({ act: act + 1, beats: Array.from({ length: 5 }, () => ({ beat: "선택", desc: "약속을 지키자 대가가 돌아온다." })) })) };
assert.equal(parseScenarioText(JSON.stringify(result)).title, result.title);
assert.equal(parseScenarioText('```json\n' + JSON.stringify(result) + '\n```').title, result.title);
for (const invalid of ["", "{}", JSON.stringify({ title: "빈 작품", acts: [] }), JSON.stringify({ title: "빈 작품", chapters: [] }), JSON.stringify({ ...result, acts: result.acts.slice(0, 3) })]) {
  assert.throws(() => parseScenarioText(invalid), /invalid|empty|incomplete/i);
}
for (const invalid of [{ ...result, logline: {} }, { ...result, characterArc: { flaw: [] } }, { ...result, creatureRoles: [null] }, { ...result, subplot: { intersections: "bad" } }]) {
  assert.throws(() => parseScenarioText(JSON.stringify(invalid)), /invalid/i);
}
assert.equal(parseScenarioText(JSON.stringify({ title: "기존 형식", chapters: [{ title: "시작", desc: "사건이 벌어진다." }] })).chapters.length, 1);

const korean = { n: "Bulgasari", country: "Korea" };
const foreign = { n: "Baba Yaga", country: "Russia" };
assert.deepEqual(selectScenarioBeings([korean], [korean, foreign], () => { throw new Error("Must not choose extra beings"); }), [korean]);
assert.deepEqual(selectScenarioBeings([], [korean, foreign], () => 0), [korean, foreign]);
assert.deepEqual(selectScenarioBeings([], [korean], () => 0), [korean]);
console.log(`PASS: ${bytes.length - 1} byte-boundary splits, UTF-8 bytewise chunks, CRLF, DONE, upstream errors, truncation, empty/partial result rejection, selected source preservation.`);
