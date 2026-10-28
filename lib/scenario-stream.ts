/** Read OpenAI-compatible SSE without dropping events split across network chunks. */
export async function readScenarioStream(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void = () => {},
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";
  let data: string[] = [];
  let eventType = "";
  let text = "";
  let complete = false;

  const dispatch = () => {
    if (!data.length && eventType !== "error") { eventType = ""; return; }
    const payload = data.join("\n");
    data = [];
    const isError = eventType === "error";
    eventType = "";
    if (isError) throw new Error("Upstream scenario generation failed");
    if (payload.trim() === "[DONE]") { complete = true; return; }
    let parsed;
    try { parsed = JSON.parse(payload); } catch { throw new Error("Invalid scenario stream event"); }
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid scenario stream event");
    if (parsed.error) throw new Error("Upstream scenario generation failed");
    const choice = parsed.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== "stop") {
      throw new Error("Truncated or interrupted scenario generation");
    }
    const content = choice?.delta?.content;
    if (typeof content === "string" && content) {
      text += content;
      onText(text);
    }
  };

  const line = (value: string) => {
    if (!value) { dispatch(); return; }
    if (value.startsWith(":")) return;
    const colon = value.indexOf(":");
    const field = colon < 0 ? value : value.slice(0, colon);
    let valueText = colon < 0 ? "" : value.slice(colon + 1);
    if (valueText.startsWith(" ")) valueText = valueText.slice(1);
    if (field === "data") data.push(valueText);
    if (field === "event") eventType = valueText;
  };

  const consume = (final = false) => {
    while (!complete) {
      const end = buffer.search(/[\r\n]/);
      if (end < 0) break;
      if (!final && buffer[end] === "\r" && end === buffer.length - 1) break;
      const delimiter = buffer[end] === "\r" && buffer[end + 1] === "\n" ? 2 : 1;
      const value = buffer.slice(0, end);
      buffer = buffer.slice(end + delimiter);
      line(value);
    }
    if (final && !complete) {
      if (buffer) line(buffer);
      buffer = "";
      dispatch();
    }
  };

  try {
    while (!complete) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      consume(done);
      if (done) break;
    }
    if (!complete) throw new Error("Incomplete scenario stream");
    if (!text.trim()) throw new Error("Empty scenario stream");
    return text;
  } finally {
    // A DONE event ends the response even if the transport remains open.
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject => !!value && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const textFields = (value: JsonObject, fields: string[]) => fields.every((field) => value[field] == null || typeof value[field] === "string");

/** Do not label empty, malformed, or truncated treatments as successful AI output. */
export function parseScenarioText(text: string): JsonObject {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Empty or invalid scenario result");
  let result: unknown;
  try { result = JSON.parse(match[0]); } catch { throw new Error("Invalid scenario JSON"); }
  if (!object(result) || !nonempty(result.title)) throw new Error("Invalid scenario result");
  if (!textFields(result, ["logline", "setting", "theme", "targetAudience", "openingImage", "closingImage", "culturalContext", "twist"])) {
    throw new Error("Invalid scenario text fields");
  }
  for (const [key, fields] of Object.entries({
    characterArc: ["protagonist", "role", "flaw", "ghost", "want", "need", "transformation"],
    secondaryCharacter: ["name", "role", "function", "miniArc"],
    conflictLayers: ["external", "internal", "relational", "thematic"],
    subplot: ["name", "description"],
  })) {
    const value = result[key];
    if (value != null && (!object(value) || !textFields(value, fields))) throw new Error("Invalid scenario character or conflict fields");
  }
  if (result.creatureRoles != null && (!Array.isArray(result.creatureRoles) || !result.creatureRoles.every((role) =>
    object(role) && nonempty(role.name) && textFields(role, ["narrativeRole", "plotMechanic", "visualSignature", "folkloreSignificance"])))) {
    throw new Error("Invalid scenario creature roles");
  }
  if (object(result.subplot) && result.subplot.intersections != null && (!Array.isArray(result.subplot.intersections) ||
    !result.subplot.intersections.every((act) => Number.isInteger(act) && Number(act) >= 1 && Number(act) <= 4))) {
    throw new Error("Invalid scenario subplot intersections");
  }

  if (result.acts !== undefined) {
    if (!Array.isArray(result.acts) || result.acts.length !== 4 || !result.acts.every((act) =>
      object(act) && textFields(act, ["label", "title", "mood", "keyDialogue"]) && Array.isArray(act.beats) && act.beats.length === 5 && act.beats.every((beat) =>
        object(beat) && nonempty(beat.beat) && nonempty(beat.desc) && textFields(beat, ["emotion"])))) {
      throw new Error("Incomplete scenario treatment");
    }
  } else if (!Array.isArray(result.chapters) || !result.chapters.length || !result.chapters.every((chapter) =>
    object(chapter) && nonempty(chapter.title) && nonempty(chapter.desc))) {
    throw new Error("Empty or invalid scenario chapters");
  }
  return result;
}

/** Explicit source selections are authoritative; auto-pick only for an empty selection. */
export function selectScenarioBeings<T extends { n: string }>(selected: T[], available: T[], random = Math.random): T[] {
  if (selected.length) return [...selected];
  const pool = [...available];
  const chosen: T[] = [];
  while (pool.length && chosen.length < 2) {
    const [being] = pool.splice(Math.floor(random() * pool.length), 1);
    if (!chosen.some((item) => item.n === being.n)) chosen.push(being);
  }
  return chosen;
}
