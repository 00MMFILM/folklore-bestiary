#!/usr/bin/env node
/**
 * generate-images.mjs
 *
 * Generates creature images using DALL-E 3 API.
 * Reads creature list from /tmp/creatures-to-generate.json
 * Saves images to public/images/creatures/{region}/
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-images.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Region mapping for directory structure
const REGION_DIR_MAP = {
  "East Asia": "east-asia",
  "Southeast Asia": "east-asia",
  "South Asia": "south-asia",
  "Central Asia": "south-asia",
  "West Asia": "south-asia",
  "Middle East": "south-asia",
  "Northern Europe": "europe",
  "Western Europe": "europe",
  "Eastern Europe": "europe",
  "Southern Europe": "europe",
  "North Africa": "africa",
  "West Africa": "africa",
  "East Africa": "africa",
  "Central Africa": "africa",
  "Southern Africa": "africa",
  "North America": "americas",
  "Central America": "americas",
  "South America": "americas",
  "Caribbean": "americas",
  "Oceania": "oceania",
  "Melanesia": "oceania",
  "Polynesia": "oceania",
  "Micronesia": "oceania",
  "Arctic": "oceania",
};

function getRegionDir(region) {
  return REGION_DIR_MAP[region] || "other";
}

function getShortId(id) {
  return id.replace(/^[a-z]{2}-/, "");
}

function sanitizeDesc(d) {
  if (!d) return "";
  return d
    .replace(/seduces?\s+humans?/gi, "enchants mortals")
    .replace(/consume\s+(their\s+)?liver/gi, "steal life energy")
    .replace(/devour|eat\s+humans?|eat\s+people/gi, "confront mortals")
    .replace(/kill|murder|slaughter/gi, "vanquish")
    .replace(/blood|gore|dismember/gi, "mystical energy")
    .replace(/corpse|dead\s+body/gi, "fallen warrior")
    .replace(/torture|torment/gi, "haunt")
    .replace(/suicide|self-harm/gi, "tragic fate")
    .replace(/vengeful|vengeance|revenge/gi, "restless")
    .replace(/terrif(y|ies|ying)/gi, "awe-inspiring")
    .replace(/horrif(y|ies|ying)/gi, "mysterious")
    .slice(0, 300);
}

async function generateImage(creature, retryCount = 0) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const safeDesc = sanitizeDesc(creature.d);
  const prompts = [
    `Mythological illustration of "${creature.name}", a legendary ${creature.type} from ${creature.country} folklore. ${safeDesc}. Style: dramatic lighting, detailed, painterly, atmospheric background, ancient mythology art. No text or words in the image.`,
    `Fantasy art of "${creature.name}", a mythical ${creature.type} from ${creature.country} legends. Majestic and mysterious creature. Style: digital painting, cinematic lighting, ethereal atmosphere. No text.`,
    `Stylized illustration of a mythical being called "${creature.name}" from ${creature.country} tradition. Ethereal, ancient, legendary creature portrait. Painterly fantasy art style. No text.`,
  ];

  const prompt = prompts[Math.min(retryCount, prompts.length - 1)];

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (err.includes("content_policy_violation") && retryCount < 2) {
      console.log(`    ⚠ Content policy — retrying with safer prompt (attempt ${retryCount + 2})...`);
      await new Promise((r) => setTimeout(r, 3000));
      return generateImage(creature, retryCount + 1);
    }
    throw new Error(`DALL-E API error: ${response.status} ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return Buffer.from(data.data[0].b64_json, "base64");
}

async function main() {
  const creatures = JSON.parse(readFileSync("/tmp/creatures-to-generate.json", "utf-8"));
  console.log(`Generating images for ${creatures.length} creatures...`);

  // Track progress
  const progressFile = resolve(ROOT, "scripts/image-gen-progress.json");
  let done = {};
  if (existsSync(progressFile)) {
    done = JSON.parse(readFileSync(progressFile, "utf-8"));
    console.log(`Resuming: ${Object.keys(done).length} already done`);
  }

  const imageMapEntries = [];

  for (let i = 0; i < creatures.length; i++) {
    const c = creatures[i];
    const shortId = getShortId(c.id);

    if (done[c.id]) {
      console.log(`  [${i + 1}/${creatures.length}] ${c.name} — already done`);
      imageMapEntries.push({ shortId, path: done[c.id] });
      continue;
    }

    const regionDir = getRegionDir(c.region);
    const outDir = resolve(ROOT, `public/creatures/${regionDir}`);
    mkdirSync(outDir, { recursive: true });

    const filename = `${shortId}.webp`;
    const outPath = resolve(outDir, filename);
    const relativePath = `/creatures/${regionDir}/${filename}`;

    console.log(`  [${i + 1}/${creatures.length}] ${c.name} (f:${c.fear}, ${c.country})...`);

    try {
      const imageBuffer = await generateImage(c);
      writeFileSync(outPath, imageBuffer);
      done[c.id] = relativePath;
      imageMapEntries.push({ shortId, path: relativePath });
      writeFileSync(progressFile, JSON.stringify(done, null, 2));
      console.log(`    ✓ Saved: ${relativePath}`);
    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
      // Save progress and continue
      writeFileSync(progressFile, JSON.stringify(done, null, 2));
    }

    // Rate limit: ~5 images per minute for DALL-E 3
    if (i < creatures.length - 1) {
      await new Promise((r) => setTimeout(r, 13000));
    }
  }

  // Output the image map entries to add to folklore-data.ts
  console.log("\n\n=== Add these to CREATURE_IMAGE_MAP ===");
  const mapStr = imageMapEntries
    .map((e) => `"${e.shortId}":"${e.path}"`)
    .join(",");
  console.log(mapStr);
  console.log(`\nTotal: ${imageMapEntries.length} images`);
  console.log(`Done: ${Object.keys(done).length} generated`);
}

main().catch(console.error);
