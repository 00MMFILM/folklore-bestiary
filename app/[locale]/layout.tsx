import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, getDictionary, LOCALES, type Locale } from "@/lib/i18n";
import { Analytics } from "@vercel/analytics/react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t["meta.siteName"]} | Global Folklore Bestiary`,
      template: `%s | ${t["meta.siteName"]}`,
    },
    description: t["meta.siteDesc"],
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      siteName: t["meta.siteName"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Global Folklore Bestiary",
    alternateName: "세계 요괴 도감",
    url: SITE_URL,
    inLanguage: [locale],
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
