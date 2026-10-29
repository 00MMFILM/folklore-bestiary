// Only unfinished form inputs are kept across login. Tokens and account data do
// not belong here; Supabase owns session persistence separately.
export const SCENARIO_DRAFT_KEY = "mythoria-scenario-login-draft-v1";
export type ScenarioLoginDraft = {
  version: 1;
  savedAt: number;
  genreId: string | null;
  beingIds: string[];
  name: string;
  role: string;
  era: string;
  customEra: string;
  keywords: string[];
  keywordInput: string;
  tone: string;
};

export function parseScenarioLoginDraft(raw: string | null, now = Date.now()): ScenarioLoginDraft | null {
  if (!raw || raw.length > 12000) return null;
  try {
    const value = JSON.parse(raw);
    const text = (field: unknown, limit: number) => typeof field === "string" && field.length <= limit;
    if (!value || typeof value !== "object" || value.version !== 1 || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt > 86400000) return null;
    if (value.genreId !== null && !text(value.genreId, 100)) return null;
    if (!Array.isArray(value.beingIds) || value.beingIds.length > 4 || !value.beingIds.every((id: unknown) => text(id, 160)) || new Set(value.beingIds).size !== value.beingIds.length) return null;
    if (!text(value.name, 100) || !text(value.role, 200) || !text(value.era, 200) || !text(value.customEra, 500) || !text(value.keywordInput, 200) || !text(value.tone, 200)) return null;
    if (!Array.isArray(value.keywords) || value.keywords.length > 5 || !value.keywords.every((keyword: unknown) => text(keyword, 200))) return null;
    return { version: 1, savedAt: value.savedAt, genreId: value.genreId, beingIds: value.beingIds, name: value.name, role: value.role, era: value.era, customEra: value.customEra, keywords: value.keywords, keywordInput: value.keywordInput, tone: value.tone };
  } catch { return null; }
}
