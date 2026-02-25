// ─── Region color theme (extracted from creature page) ───

export const REGION_COLORS: Record<string, { accent: string; bg: string }> = {
  "East Asia": { accent: "#ff3b3b", bg: "#2a0f0f" },
  "Southeast Asia": { accent: "#ff3b3b", bg: "#2a0f0f" },
  "South Asia": { accent: "#ff9933", bg: "#2a1a0f" },
  "Central Asia": { accent: "#ff3b3b", bg: "#2a0f0f" },
  "West Asia": { accent: "#ff3b3b", bg: "#2a0f0f" },
  "Northern Europe": { accent: "#6b8aff", bg: "#0f0f2a" },
  "Western Europe": { accent: "#6b8aff", bg: "#0f0f2a" },
  "Eastern Europe": { accent: "#6b8aff", bg: "#0f0f2a" },
  "Southern Europe": { accent: "#6b8aff", bg: "#0f0f2a" },
  "North Africa": { accent: "#ffaa2b", bg: "#2a1f0f" },
  "West Africa": { accent: "#ffaa2b", bg: "#2a1f0f" },
  "East Africa": { accent: "#ffaa2b", bg: "#2a1f0f" },
  "Central Africa": { accent: "#ffaa2b", bg: "#2a1f0f" },
  "Southern Africa": { accent: "#ffaa2b", bg: "#2a1f0f" },
  "North America": { accent: "#3bff6b", bg: "#0f2a14" },
  "Central America": { accent: "#3bff6b", bg: "#0f2a14" },
  "South America": { accent: "#3bff6b", bg: "#0f2a14" },
  Caribbean: { accent: "#3bff6b", bg: "#0f2a14" },
  Oceania: { accent: "#3bdfff", bg: "#0f222a" },
};

export function getRegionColors(region: string) {
  return REGION_COLORS[region] || { accent: "#cc8844", bg: "#1a1410" };
}
