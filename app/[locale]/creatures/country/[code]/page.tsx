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
import { getCountryName, getRegionName } from "@/lib/i18n-names";
import { getRegionColors } from "@/lib/region-colors";
import Breadcrumb from "@/components/Breadcrumb";
import CreatureCard from "@/components/CreatureCard";
import LanguageSelector from "@/components/LanguageSelector";
import EncounterPromoCard from "@/components/EncounterPromoCard";
import GuidePromoCard from "@/components/GuidePromoCard";
import WriterStudioPromo from "@/components/writer/WriterStudioPromo";

import { getEditorialCountry } from "@/lib/editorial-countries";
import { GrowthView, GrowthLink } from "@/components/GrowthAnalytics";
import GrowthReadingLinks from "@/components/GrowthReadingLinks";
import { GROWTH_CAMPAIGN_ID } from "@/lib/growth-campaign";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

// ─── SSG: 4 × 151 = 604 pages ───

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
  const editorial = getEditorialCountry(code, locale);
  const creatures = getCreaturesByCountryCode(code).filter(c => !editorial?.listedIds || editorial.listedIds.includes(c.id));
  const cName = getCountryName(country.name, locale);
  const title = editorial?.title || `${cName}${t["list.creaturesInCountry"]} (${creatures.length}${t["list.creatureCount"]})`;

  const langAlternates: Record<string, string> = {};
  for (const l of LOCALES) {
    langAlternates[l] = `${SITE_URL}/${l}/creatures/country/${code}`;
  }

  return {
    title,
    description: editorial?.metaDescription || (
      locale === "ko"
        ? `${cName}의 전설 속 존재 ${creatures.length}종을 만나보세요.`
        : locale === "zh"
        ? `探索${cName}的${creatures.length}种传说生物。`
        : locale === "ja"
        ? `${cName}の伝説の存在${creatures.length}種をご覧ください。`
        : `Discover ${creatures.length} legendary creatures from ${country.name}.`),
    openGraph: {
      type: "website",
      title,
      description: editorial?.metaDescription,
      url: `${SITE_URL}/${locale}/creatures/country/${code}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: editorial?.metaDescription, images: ["/og-default.png"] },
    alternates: {
      canonical: `${SITE_URL}/${locale}/creatures/country/${code}`,
      languages: langAlternates,
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
  const editorial = getEditorialCountry(code, locale);
  const creatures = getCreaturesByCountryCode(code).filter(c => !editorial?.listedIds || editorial.listedIds.includes(c.id));
  const colors = getRegionColors(country.region);
  const regionSlug = regionToSlug(country.region);
  const countryName = getCountryName(country.name, locale);
  const regionName = getRegionName(country.region, locale);

  const breadcrumbItems = [
    { label: t["nav.home"], href: "/" },
    { label: t["index.breadcrumb"], href: `/${locale}/creatures` },
    { label: regionName, href: `/${locale}/creatures/region/${regionSlug}` },
    { label: countryName },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: editorial?.title || `${countryName}${t["list.creaturesInCountry"]}`,
      ...(editorial ? { description: editorial.metaDescription, dateModified: editorial.reviewedAt, citation: editorial.sources.map(source => source.url) } : {}),
      url: `${SITE_URL}/${locale}/creatures/country/${code}`,
      inLanguage: locale,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: creatures.length,
        itemListElement: creatures.slice(0, 50).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.n,
          url: `${SITE_URL}/${locale}/creatures/${c.id}`,
        })),
      },
    },
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

      <LanguageSelector locale={locale} basePath={`/creatures/country/${code}`} />

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
            {editorial?.title || countryName}
          </h1>
          <p style={{ color: "#999", fontSize: "16px" }}>
            <Link
              href={`/${locale}/creatures/region/${regionSlug}`}
              style={{ color: colors.accent, textDecoration: "none" }}
            >
              {regionName}
            </Link>
            {" · "}
            {creatures.length}
            {t["list.creatureCount"]}
          </p>
        </header>

        {editorial && <section aria-label={locale === "ko" ? "처음 읽는 한국 설화" : "Start reading Jamaican folklore"} style={{ maxWidth: 800, lineHeight: 1.8, marginBottom: 32 }}>
          <GrowthView page={`/${locale}/creatures/country/${code.toLowerCase()}`} campaign={GROWTH_CAMPAIGN_ID} />
          <p style={{ fontSize: 18, color: "#ded6cc" }}>{editorial.intro}</p>
          <ul style={{ paddingLeft: 20 }}>
            {editorial.picks.map(pick => <li key={pick.id}>
              <GrowthLink href={`/${locale}/creatures/${pick.id}`} page={`/${locale}/creatures/country/${code.toLowerCase()}`} campaign={GROWTH_CAMPAIGN_ID}>{pick.label}</GrowthLink>
              {" — "}{pick.reason}
            </li>)}
          </ul>
          {editorial.sections.map(section => <section key={section.title} style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, color: colors.accent }}>{section.title}</h2><p>{section.text}</p>
          </section>)}
          {editorial.questions.map(item => <details key={item.question} style={{ margin: "16px 0" }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>{item.question}</summary><p>{item.answer}</p></details>)}
          <p style={{ color: "#bbb", fontSize: 14 }}>
            {locale === "ko" ? "출처 · " : "Sources · "}
            {editorial.sources.map((source, index) => <span key={source.url}>{index > 0 && " · "}<a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: "#cdbb9e" }}>{source.title}</a></span>)}
            <span style={{ display: "block" }}>{locale === "ko" ? "확인일" : "Reviewed"}: {editorial.reviewedAt}</span>
          </p>
          <GrowthReadingLinks page={`/${locale}/creatures/country/${code.toLowerCase()}`} locale={locale} links={[]} />
        </section>}
        {code.toLowerCase() === "kr" && (
          <div style={{ marginBottom: 24, display: "grid", gap: 12 }}>
            {locale === "ko" && <WriterStudioPromo />}
            <GuidePromoCard locale={locale} />
            <EncounterPromoCard locale={locale} placement="korea" />
          </div>
        )}

        {editorial && <h2 style={{ fontSize: 24, marginBottom: 20 }}>{editorial.listTitle}</h2>}
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
    </>
  );
}
