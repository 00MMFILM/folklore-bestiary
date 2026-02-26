import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCreatures,
  getAllRegions,
  getAllCountries,
  getCreaturesByRegion,
  regionToSlug,
} from "@/lib/folklore-data";
import { isValidLocale, getDictionary, LOCALES, type Locale } from "@/lib/i18n";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";
import CreatureCard from "@/components/CreatureCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: 2 pages ───

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// ─── Metadata ───

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const t = getDictionary(locale);
  const creatures = getAllCreatures();
  const altLocale = locale === "ko" ? "en" : "ko";
  const title =
    locale === "ko"
      ? `${t["index.title"]} (${creatures.length}종)`
      : `${t["index.title"]} (${creatures.length} Creatures)`;
  const description = t["index.desc"];

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/${locale}/creatures`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/creatures`,
      languages: {
        [locale]: `${SITE_URL}/${locale}/creatures`,
        [altLocale]: `${SITE_URL}/${altLocale}/creatures`,
      },
    },
  };
}

// ─── Page ───

export default async function CreatureIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const t = getDictionary(locale);
  const allCreatures = getAllCreatures();
  const regions = getAllRegions();
  const allCountries = getAllCountries();
  const altLocale = locale === "ko" ? "en" : "ko";

  // Group countries by region
  const countriesByRegion = new Map<string, { code: string; name: string }[]>();
  for (const c of allCountries) {
    const list = countriesByRegion.get(c.region) || [];
    list.push({ code: c.code, name: c.name });
    countriesByRegion.set(c.region, list);
  }

  // Top 6 creatures per region (sorted by fear desc)
  const regionData = regions.map((region) => {
    const creatures = getCreaturesByRegion(region);
    const top6 = [...creatures].sort((a, b) => b.f - a.f).slice(0, 6);
    const countries = (countriesByRegion.get(region) || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return { region, creatures, top6, countries };
  });

  // CollectionPage JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      locale === "ko"
        ? `${t["index.title"]} (${allCreatures.length}종)`
        : `${t["index.title"]} (${allCreatures.length} Creatures)`,
    description: t["index.desc"],
    url: `${SITE_URL}/${locale}/creatures`,
    inLanguage: locale,
    numberOfItems: allCreatures.length,
    publisher: { "@type": "Organization", name: "Global Folklore Bestiary" },
  };

  const breadcrumbItems = [
    { label: t["nav.home"], href: "/" },
    { label: t["index.breadcrumb"] },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1a1410 0%, #0a0a0a 100%)",
          color: "#eed8c0",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <Breadcrumb items={breadcrumbItems} locale={locale} accentColor="#cc8844" />

        {/* Language switch */}
        <div style={{ padding: "8px 24px", textAlign: "right" }}>
          <Link
            href={`/${altLocale}/creatures`}
            style={{ color: "#888", textDecoration: "none", fontSize: "13px" }}
          >
            {altLocale === "ko" ? "한국어" : "English"}
          </Link>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
          {/* Header */}
          <header style={{ marginBottom: "48px", textAlign: "center" }}>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 800,
                color: "#cc8844",
                marginBottom: "12px",
                lineHeight: 1.2,
              }}
            >
              {t["index.title"]}{" "}
              <span style={{ fontSize: "0.6em", color: "#999" }}>
                ({allCreatures.length}
                {locale === "ko" ? "종" : " creatures"})
              </span>
            </h1>
            <p style={{ color: "#999", fontSize: "18px", margin: 0 }}>
              {t["index.desc"]}
            </p>
          </header>

          {/* Region sections */}
          {regionData.map(({ region, creatures, top6, countries }) => {
            const colors = getRegionColors(region);
            const slug = regionToSlug(region);

            return (
              <section
                key={region}
                style={{
                  marginBottom: "48px",
                  padding: "24px",
                  borderRadius: "16px",
                  background: `${colors.bg}88`,
                  border: `1px solid ${colors.accent}22`,
                }}
              >
                {/* Region header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ margin: 0 }}>
                    <Link
                      href={`/${locale}/creatures/region/${slug}`}
                      style={{
                        color: colors.accent,
                        textDecoration: "none",
                        fontSize: "clamp(20px, 3vw, 28px)",
                        fontWeight: 700,
                      }}
                    >
                      {region}
                    </Link>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#999",
                        fontWeight: 400,
                        marginLeft: "8px",
                      }}
                    >
                      ({creatures.length}
                      {locale === "ko" ? "종" : " creatures"})
                    </span>
                  </h2>
                  <Link
                    href={`/${locale}/creatures/region/${slug}`}
                    style={{
                      color: colors.accent,
                      textDecoration: "none",
                      fontSize: "14px",
                    }}
                  >
                    {t["index.viewAll"]}
                  </Link>
                </div>

                {/* Country chips */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "16px",
                  }}
                >
                  {countries.map((c) => (
                    <Link
                      key={c.code}
                      href={`/${locale}/creatures/country/${c.code.toLowerCase()}`}
                      style={{
                        background: "#ffffff11",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        color: "#ccc",
                        textDecoration: "none",
                        border: "1px solid #ffffff11",
                      }}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>

                {/* Top 6 creature cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {top6.map((c) => (
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
              </section>
            );
          })}

          {/* CTA */}
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              borderTop: "1px solid #cc884422",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-block",
                background: "#cc8844",
                color: "#000",
                padding: "12px 32px",
                borderRadius: "8px",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "16px",
              }}
            >
              {t["nav.exploreMap"]}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
