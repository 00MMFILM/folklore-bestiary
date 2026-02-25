import type { MetadataRoute } from "next";
import { getAllCreatures, getAllRegions, getAllCountries, regionToSlug } from "@/lib/folklore-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";
const LOCALES = ["ko", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const creatures = getAllCreatures();
  const regions = getAllRegions();
  const countries = getAllCountries();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push({
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1.0,
  });

  // Creature detail pages (2 × 707 = 1414)
  for (const locale of LOCALES) {
    for (const c of creatures) {
      entries.push({
        url: `${SITE_URL}/${locale}/creatures/${c.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Region list pages (2 × 19 = 38)
  for (const locale of LOCALES) {
    for (const region of regions) {
      entries.push({
        url: `${SITE_URL}/${locale}/creatures/region/${regionToSlug(region)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Country list pages (2 × 151 = 302)
  for (const locale of LOCALES) {
    for (const country of countries) {
      entries.push({
        url: `${SITE_URL}/${locale}/creatures/country/${country.code.toLowerCase()}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
