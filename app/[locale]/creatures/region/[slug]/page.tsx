import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllRegions,
  getCreaturesByRegion,
  regionToSlug,
  slugToRegion,
} from "@/lib/folklore-data";
import { isValidLocale, getDictionary, LOCALES, type Locale } from "@/lib/i18n";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";
import CreatureCard from "@/components/CreatureCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: 2 × 19 = 38 pages ───

export function generateStaticParams() {
  const regions = getAllRegions();
  return LOCALES.flatMap((locale) =>
    regions.map((r) => ({ locale, slug: regionToSlug(r) }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const region = slugToRegion(slug);
  if (!region) return { title: "Not Found" };

  const t = getDictionary(locale);
  const creatures = getCreaturesByRegion(region);
  const altLocale = locale === "ko" ? "en" : "ko";
  const title = `${region}${t["list.creaturesInRegion"]} (${creatures.length}${t["list.creatureCount"]})`;

  return {
    title,
    description:
      locale === "ko"
        ? `${region} 지역의 전설 속 존재 ${creatures.length}종을 만나보세요.`
        : `Discover ${creatures.length} legendary creatures from ${region}.`,
    openGraph: {
      type: "website",
      title,
      url: `${SITE_URL}/${locale}/creatures/region/${slug}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/creatures/region/${slug}`,
      languages: {
        [locale]: `${SITE_URL}/${locale}/creatures/region/${slug}`,
        [altLocale]: `${SITE_URL}/${altLocale}/creatures/region/${slug}`,
      },
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const region = slugToRegion(slug);
  if (!region) notFound();

  const t = getDictionary(locale);
  const creatures = getCreaturesByRegion(region);
  const colors = getRegionColors(region);
  const altLocale = locale === "ko" ? "en" : "ko";

  // Get unique countries in this region
  const countries = Array.from(
    new Map(creatures.map((c) => [c.countryCode, { code: c.countryCode, name: c.country }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const breadcrumbItems = [
    { label: t["nav.home"], href: "/" },
    { label: t["index.breadcrumb"], href: `/${locale}/creatures` },
    { label: region },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0a0a 100%)`,
        color: "#eed8c0",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Breadcrumb items={breadcrumbItems} locale={locale} accentColor={colors.accent} />

      {/* Language switch */}
      <div style={{ padding: "8px 24px", textAlign: "right" }}>
        <Link
          href={`/${altLocale}/creatures/region/${slug}`}
          style={{ color: "#888", textDecoration: "none", fontSize: "13px" }}
        >
          {altLocale === "ko" ? "한국어" : "English"}
        </Link>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <header style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 800,
              color: colors.accent,
              marginBottom: "8px",
            }}
          >
            {region}
          </h1>
          <p style={{ color: "#999", fontSize: "16px" }}>
            {creatures.length}
            {t["list.creatureCount"]}
          </p>
        </header>

        {/* Country links */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}>
            {t["list.allCountries"]}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/${locale}/creatures/country/${c.code.toLowerCase()}`}
                style={{
                  background: "#ffffff11",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  color: "#ccc",
                  textDecoration: "none",
                  border: "1px solid #ffffff11",
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Creature Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {creatures.map((c) => (
            <CreatureCard
              key={c.id}
              id={c.id}
              name={c.n}
              localName={c.ln}
              type={c.t}
              fear={c.f}
              region={c.region}
              country={c.country}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
