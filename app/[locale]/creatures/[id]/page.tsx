import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCreatures, getCreatureById, getCreatureImage } from "@/lib/folklore-data";
import { isValidLocale, getDictionary, getCtLabel, LOCALES, type Locale } from "@/lib/i18n";
import { getCountryName, getRegionName, getTypeName } from "@/lib/i18n-names";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";
import LanguageSelector from "@/components/LanguageSelector";
import { getCreatureTranslation } from "@/lib/creature-translations";
import { getCreatureArticle } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: pre-render important creatures only (rest via ISR) ───

export function generateStaticParams() {
  const creatures = getAllCreatures().filter((c) => c.ip);
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
  const { locale, id: rawId } = await params;
  const id = decodeURIComponent(rawId); // 한글 슬러그는 인코딩된 채로 도착
  if (!isValidLocale(locale)) return { title: "Not Found" };
  const creature = getCreatureById(id);
  if (!creature) return { title: "Creature Not Found" };

  const t = getDictionary(locale);
  const image = getCreatureImage(creature.id);
  const ogImage = image || "/og-default.png";
  const countryLocalized = getCountryName(creature.country, locale as Locale);
  const trans = getCreatureTranslation(creature.id, locale as Locale);
  const descText = trans?.d || creature.d;
  const title = `${creature.n} — ${countryLocalized}`;
  const description = descText.length > 160 ? descText.slice(0, 157) + "..." : descText;

  const langAlternates: Record<string, string> = {};
  for (const l of LOCALES) {
    langAlternates[l] = `${SITE_URL}/${l}/creatures/${creature.id}`;
  }

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
      languages: langAlternates,
    },
  };
}

// ─── Page Component ───

export default async function CreaturePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id: rawId } = await params;
  const id = decodeURIComponent(rawId); // 한글 슬러그는 인코딩된 채로 도착
  if (!isValidLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const creature = getCreatureById(id);
  if (!creature) notFound();

  const t = getDictionary(locale);
  const image = getCreatureImage(creature.id);
  const colors = getRegionColors(creature.region);
  const trans = getCreatureTranslation(creature.id, locale);

  const countryName = getCountryName(creature.country, locale);
  const regionName = getRegionName(creature.region, locale);
  const typeName = getTypeName(creature.t, locale);

  const description = trans?.d || creature.d;
  const abilities = Array.isArray(trans?.ab) ? trans.ab : creature.ab;
  const weaknesses = Array.isArray(trans?.wk) ? trans.wk : creature.wk;
  const rawSh = trans?.sh || creature.sh;
  const storyHooks = rawSh ? (Array.isArray(rawSh) ? rawSh : [rawSh]) : null;

  // 심화 아티클 (있을 때만 — content/articles/{id}.json)
  const article = getCreatureArticle(creature.id, locale);
  const articleSections = article
    ? ([
        ["article.origin", article.sections.origin],
        ["article.legend", article.sections.legend],
        ["article.variants", article.sections.variants],
        ["article.culture", article.sections.culture],
      ] as const).filter(([, text]) => text && text.length > 0)
    : [];
  const articleBody = articleSections.map(([, text]) => text).join("\n\n");

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
    ...(articleBody
      ? { articleBody, wordCount: articleBody.split(/\s+/).length }
      : {}),
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
    { label: t["index.breadcrumb"], href: `/${locale}/creatures` },
    {
      label: regionName,
      href: `/${locale}/creatures/region/${creature.region.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      label: countryName,
      href: `/${locale}/creatures/country/${creature.countryCode.toLowerCase()}`,
    },
    { label: creature.ln || creature.n },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  // 내부 링크: 같은 나라 / 같은 유형 (SEO + 탐색 동선)
  const allCreatures = getAllCreatures();
  const relatedCountry = allCreatures
    .filter((c) => c.countryCode === creature.countryCode && c.id !== creature.id)
    .slice(0, 6);
  const relatedType = allCreatures
    .filter((c) => c.t === creature.t && c.countryCode !== creature.countryCode)
    .slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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

        <LanguageSelector locale={locale} basePath={`/creatures/${creature.id}`} />

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
                {typeName}
              </span>
              <span
                style={{
                  background: "#ffffff11",
                  padding: "4px 12px",
                  borderRadius: "20px",
                }}
              >
                {countryName} · {regionName}
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
            <p style={{ lineHeight: 1.8, fontSize: "16px", color: "#ccc" }}>{description}</p>
          </section>

          {/* In-depth article sections */}
          {articleSections.map(([key, text]) => (
            <section key={key} style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "18px", color: colors.accent, marginBottom: "12px" }}>
                {t[key]}
              </h2>
              {text.split(/\n{2,}|\n/).filter(Boolean).map((para, i) => (
                <p
                  key={i}
                  style={{ lineHeight: 1.8, fontSize: "16px", color: "#ccc", marginBottom: "12px" }}
                >
                  {para}
                </p>
              ))}
            </section>
          ))}
          {article && (
            <p style={{ fontSize: "12px", color: "#777", marginBottom: "32px" }}>
              {article.factBased ? (
                t["article.attributionFact"].replace("{title}", article.sourceTitle)
              ) : (
                <>
                  {t["article.attribution"].replace("{title}", article.sourceTitle)}{" · "}
                  <a
                    href={`https://${article.sourceLang}.wikipedia.org/wiki/${encodeURIComponent(article.sourceTitle)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#999" }}
                  >
                    Wikipedia
                  </a>
                </>
              )}
            </p>
          )}

          {/* Abilities & Weaknesses */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {abilities && abilities.length > 0 && (
              <section>
                <h2
                  style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
                >
                  {t["creature.abilities"]}
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {abilities.map((a) => (
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
            {weaknesses && weaknesses.length > 0 && (
              <section>
                <h2
                  style={{ fontSize: "16px", color: "#ff6666", marginBottom: "12px" }}
                >
                  {t["creature.weaknesses"]}
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {weaknesses.map((w) => (
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
          {storyHooks && storyHooks.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}
              >
                {t["creature.storyHooks"]}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {storyHooks.map((s) => (
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

          {/* Related creatures (internal links) */}
          {[
            { title: `${t["creature.relatedCountry"]} · ${countryName}`, items: relatedCountry },
            { title: `${t["creature.relatedType"]} · ${typeName}`, items: relatedType },
          ].map(
            ({ title, items }) =>
              items.length > 0 && (
                <section key={title} style={{ marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "16px", color: colors.accent, marginBottom: "12px" }}>
                    {title}
                  </h2>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {items.map((c) => (
                      <Link
                        key={c.id}
                        href={`/${locale}/creatures/${c.id}`}
                        style={{
                          display: "block",
                          background: "#ffffff0a",
                          border: "1px solid #ffffff18",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          textDecoration: "none",
                          color: "#eed8c0",
                          fontSize: "14px",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: "2px" }}>{c.n}</div>
                        <div style={{ fontSize: "12px", color: "#999" }}>
                          {getCountryName(c.country, locale)} · {getTypeName(c.t, locale)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
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
