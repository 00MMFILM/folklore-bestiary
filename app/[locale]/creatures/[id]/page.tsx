import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCreatures, getCreatureById, getCreatureImage } from "@/lib/folklore-data";
import { isValidLocale, getDictionary, getCtLabel, LOCALES, type Locale } from "@/lib/i18n";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: generate 2 × 707 = 1414 pages ───

export function generateStaticParams() {
  const creatures = getAllCreatures();
  return LOCALES.flatMap((locale) =>
    creatures.map((c) => ({ locale, id: c.id }))
  );
}

// ─── Dynamic metadata ───

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return { title: "Not Found" };
  const creature = getCreatureById(id);
  if (!creature) return { title: "Creature Not Found" };

  const t = getDictionary(locale);
  const image = getCreatureImage(creature.id);
  const ogImage = image || "/og-default.png";
  const title = `${creature.n} — ${creature.country}`;
  const description = creature.d.length > 160 ? creature.d.slice(0, 157) + "..." : creature.d;
  const altLocale = locale === "ko" ? "en" : "ko";

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/${locale}/creatures/${creature.id}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: creature.n }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/creatures/${creature.id}`,
      languages: {
        [locale]: `${SITE_URL}/${locale}/creatures/${creature.id}`,
        [altLocale]: `${SITE_URL}/${altLocale}/creatures/${creature.id}`,
      },
    },
  };
}

// ─── Page Component ───

export default async function CreaturePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const creature = getCreatureById(id);
  if (!creature) notFound();

  const t = getDictionary(locale);
  const image = getCreatureImage(creature.id);
  const colors = getRegionColors(creature.region);
  const altLocale = locale === "ko" ? "en" : "ko";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: creature.n,
    description: creature.d,
    image: image ? `${SITE_URL}${image}` : `${SITE_URL}/og-default.png`,
    author: { "@type": "Organization", name: "Global Folklore Bestiary" },
    publisher: { "@type": "Organization", name: "Global Folklore Bestiary" },
    mainEntityOfPage: `${SITE_URL}/${locale}/creatures/${creature.id}`,
    inLanguage: locale,
    keywords: [
      creature.t,
      creature.country,
      creature.region,
      creature.ln,
      ...(creature.ab || []),
    ].join(", "),
  };

  const breadcrumbItems = [
    { label: t["nav.home"], href: "/" },
    {
      label: creature.region,
      href: `/${locale}/creatures/region/${creature.region.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      label: creature.country,
      href: `/${locale}/creatures/country/${creature.countryCode.toLowerCase()}`,
    },
    { label: creature.ln || creature.n },
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
          background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0a0a 100%)`,
          color: "#eed8c0",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <Breadcrumb items={breadcrumbItems} locale={locale} accentColor={colors.accent} />

        {/* Language switch */}
        <div style={{ padding: "8px 24px", textAlign: "right" }}>
          <Link
            href={`/${altLocale}/creatures/${creature.id}`}
            style={{ color: "#888", textDecoration: "none", fontSize: "13px" }}
          >
            {altLocale === "ko" ? "한국어" : "English"}
          </Link>
        </div>

        <article style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
          {/* Creature Image */}
          {image && (
            <div
              style={{
                width: "100%",
                maxWidth: "600px",
                margin: "0 auto 32px",
                borderRadius: "16px",
                overflow: "hidden",
                border: `2px solid ${colors.accent}44`,
                boxShadow: `0 0 40px ${colors.accent}22`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={creature.n}
                width={600}
                height={600}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          )}

          {/* Header */}
          <header style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 800,
                color: colors.accent,
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              {creature.n}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  background: `${colors.accent}22`,
                  color: colors.accent,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${colors.accent}44`,
                }}
              >
                {creature.t}
              </span>
              <span
                style={{
                  background: "#ffffff11",
                  padding: "4px 12px",
                  borderRadius: "20px",
                }}
              >
                {creature.country} · {creature.region}
              </span>
              {creature.ct && (
                <span
                  style={{
                    background: "#ffffff11",
                    padding: "4px 12px",
                    borderRadius: "20px",
                  }}
                >
                  {getCtLabel(locale, creature.ct)}
                </span>
              )}
              <span
                style={{
                  background: creature.f >= 7 ? "#ff000022" : "#ffaa0022",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  color: creature.f >= 7 ? "#ff4444" : "#ffaa44",
                }}
              >
                {t["creature.fear"]} {creature.f}/10
              </span>
            </div>
          </header>

          {/* Description */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", color: colors.accent, marginBottom: "12px" }}>
              {t["creature.description"]}
            </h2>
            <p style={{ lineHeight: 1.8, fontSize: "16px", color: "#ccc" }}>{creature.d}</p>
          </section>

          {/* Abilities & Weaknesses */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {creature.ab && creature.ab.length > 0 && (
              <section>
                <h2
                  style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
                >
                  {t["creature.abilities"]}
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {creature.ab.map((a) => (
                    <li
                      key={a}
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #ffffff11",
                        fontSize: "14px",
                      }}
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {creature.wk && creature.wk.length > 0 && (
              <section>
                <h2
                  style={{ fontSize: "16px", color: "#ff6666", marginBottom: "12px" }}
                >
                  {t["creature.weaknesses"]}
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {creature.wk.map((w) => (
                    <li
                      key={w}
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #ffffff11",
                        fontSize: "14px",
                      }}
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sources */}
          {creature.src && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
              >
                {t["creature.sources"]}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(Array.isArray(creature.src) ? creature.src : [creature.src]).map((s) => (
                  <li key={s} style={{ padding: "4px 0", fontSize: "14px", color: "#999" }}>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Genres */}
          {creature.gf && creature.gf.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
              >
                {t["creature.genres"]}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {creature.gf.map((g) => (
                  <span
                    key={g}
                    style={{
                      background: "#ffffff11",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Story Hooks */}
          {creature.sh && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
              >
                {t["creature.storyHooks"]}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(Array.isArray(creature.sh) ? creature.sh : [creature.sh]).map((s) => (
                  <li
                    key={s}
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #ffffff11",
                      fontSize: "14px",
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CTA */}
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              borderTop: `1px solid ${colors.accent}22`,
            }}
          >
            <Link
              href={`/?creature=${creature.id}`}
              style={{
                display: "inline-block",
                background: colors.accent,
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
        </article>
      </main>
    </>
  );
}
