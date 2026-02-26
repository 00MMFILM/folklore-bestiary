import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllCountries,
  getCreaturesByCountryCode,
  getCountryByCode,
  regionToSlug,
} from "@/lib/folklore-data";
import { isValidLocale, getDictionary, LOCALES, type Locale } from "@/lib/i18n";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";
import CreatureCard from "@/components/CreatureCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: 2 × 151 = 302 pages ───

export function generateStaticParams() {
  const countries = getAllCountries();
  return LOCALES.flatMap((locale) =>
    countries.map((c) => ({ locale, code: c.code.toLowerCase() }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  if (!isValidLocale(locale)) return {};
  const country = getCountryByCode(code);
  if (!country) return { title: "Not Found" };

  const t = getDictionary(locale);
  const creatures = getCreaturesByCountryCode(code);
  const altLocale = locale === "ko" ? "en" : "ko";
  const title = `${country.name}${t["list.creaturesInCountry"]} (${creatures.length}${t["list.creatureCount"]})`;

  return {
    title,
    description:
      locale === "ko"
        ? `${country.name}의 전설 속 존재 ${creatures.length}종을 만나보세요.`
        : `Discover ${creatures.length} legendary creatures from ${country.name}.`,
    openGraph: {
      type: "website",
      title,
      url: `${SITE_URL}/${locale}/creatures/country/${code}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/creatures/country/${code}`,
      languages: {
        [locale]: `${SITE_URL}/${locale}/creatures/country/${code}`,
        [altLocale]: `${SITE_URL}/${altLocale}/creatures/country/${code}`,
      },
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: rawLocale, code } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const country = getCountryByCode(code);
  if (!country) notFound();

  const t = getDictionary(locale);
  const creatures = getCreaturesByCountryCode(code);
  const colors = getRegionColors(country.region);
  const altLocale = locale === "ko" ? "en" : "ko";
  const regionSlug = regionToSlug(country.region);

  const breadcrumbItems = [
    { label: t["nav.home"], href: "/" },
    { label: t["index.breadcrumb"], href: `/${locale}/creatures` },
    { label: country.region, href: `/${locale}/creatures/region/${regionSlug}` },
    { label: country.name },
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
          href={`/${altLocale}/creatures/country/${code}`}
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
            {country.name}
          </h1>
          <p style={{ color: "#999", fontSize: "16px" }}>
            <Link
              href={`/${locale}/creatures/region/${regionSlug}`}
              style={{ color: colors.accent, textDecoration: "none" }}
            >
              {country.region}
            </Link>
            {" · "}
            {creatures.length}
            {t["list.creatureCount"]}
          </p>
        </header>

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
