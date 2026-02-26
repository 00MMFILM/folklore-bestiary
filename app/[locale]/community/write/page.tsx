import Link from "next/link";
import type { Metadata } from "next";
import { isValidLocale, getDictionary, type Locale } from "@/lib/i18n";
import PostForm from "@/components/community/PostForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isValidLocale(locale) ? locale : "ko";
  const t = getDictionary(l);
  return {
    title: `${t["community.write"]} | ${t["community.title"]}`,
  };
}

export default async function WritePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ko";
  const t = getDictionary(locale);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1410 0%, #0a0a0a 100%)",
        color: "#eed8c0",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        <Link
          href={`/${locale}/community`}
          style={{ color: "#888", fontSize: 13, textDecoration: "none" }}
        >
          {t["community.back"]}
        </Link>
        <h1 style={{ margin: "12px 0 24px", fontSize: 22, fontWeight: 700 }}>
          ✏️ {t["community.write"]}
        </h1>
        <PostForm locale={locale} mode="create" />
      </div>
    </div>
  );
}
