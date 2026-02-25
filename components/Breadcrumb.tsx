import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale: Locale;
  accentColor?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";

export default function Breadcrumb({ items, locale, accentColor = "#cc8844" }: BreadcrumbProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="breadcrumb"
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${accentColor}33`,
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "14px",
        }}
      >
        {items.map((item, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {i > 0 && <span style={{ color: "#666" }}>/</span>}
            {item.href ? (
              <Link
                href={item.href}
                style={{ color: accentColor, textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: "#999" }}>{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
