import type { Metadata } from "next";
import { CREATURE_COUNT, COUNTRY_COUNT } from "@/lib/site-stats";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Global Folklore Bestiary | 세계 요괴 도감",
    template: "%s | 세계 요괴 도감",
  },
  description:
    `${COUNTRY_COUNT}개국 ${CREATURE_COUNT.toLocaleString("en-US")}종 전설 속 존재들의 인터랙티브 월드맵. 구미호, 드래곤, 뱀파이어 등 세계 신화·전설·민담 크리처를 탐험하세요.`,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Global Folklore Bestiary",
    title: "Global Folklore Bestiary | 세계 요괴 도감",
    description:
      `${COUNTRY_COUNT}개국 ${CREATURE_COUNT.toLocaleString("en-US")}종 전설 속 존재들의 인터랙티브 월드맵. 구미호, 드래곤, 뱀파이어 등 세계 신화·전설·민담 크리처를 탐험하세요.`,
    url: SITE_URL,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Global Folklore Bestiary" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Folklore Bestiary | 세계 요괴 도감",
    description:
      `${COUNTRY_COUNT}개국 ${CREATURE_COUNT.toLocaleString("en-US")}종 전설 속 존재들의 인터랙티브 월드맵`,
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    other: {
      "naver-site-verification": "22e93b98c9c78fc4d73554a940dad3f777276dbd",
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Global Folklore Bestiary",
    alternateName: "세계 요괴 도감",
    url: SITE_URL,
    description:
      `${COUNTRY_COUNT}개국 ${CREATURE_COUNT.toLocaleString("en-US")}종 전설 속 존재들의 인터랙티브 월드맵`,
    inLanguage: ["ko", "en", "zh", "ja"],
  };

  return (
    <html lang="ko">
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
