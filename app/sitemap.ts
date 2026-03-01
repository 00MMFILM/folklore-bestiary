import type { MetadataRoute } from "next";
import { getAllCreatures, getAllRegions, getAllCountries, regionToSlug } from "@/lib/folklore-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";
const LOCALES = ["ko", "en", "zh", "ja"] as const;

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

  // Creature index pages (4)
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale}/creatures`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Creature detail pages (4 × N)
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

  // Region list pages (4 × 19 = 76)
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

  // Country list pages (4 × 151 = 604)
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

  // Community pages (4)
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale}/community`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  return entries;
}
