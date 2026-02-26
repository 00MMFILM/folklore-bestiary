import Link from "next/link";
import type { Metadata } from "next";
import { isValidLocale, getDictionary, type Locale } from "@/lib/i18n";
import { getAdminClient } from "@/lib/supabase";
import { POSTS_PER_PAGE } from "@/lib/community-types";
import PostList from "@/components/community/PostList";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isValidLocale(locale) ? locale : "ko";
  const t = getDictionary(l);
  return {
    title: t["community.title"],
    description: t["community.desc"],
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ko";
  const t = getDictionary(locale);

  // Fetch initial posts server-side
  const supabase = getAdminClient();
  const { data, count } = await supabase
    .from("community_posts")
    .select("id, locale, nickname, title, genre, creature_ids, view_count, created_at", {
      count: "exact",
    })
    .eq("locale", locale)
    .order("created_at", { ascending: false })
    .range(0, POSTS_PER_PAGE - 1);

  const posts = data || [];
  const total = count || 0;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Link
              href="/"
              style={{ color: "#888", fontSize: 12, textDecoration: "none" }}
            >
              {t["nav.home"]}
            </Link>
            <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 700 }}>
              {t["community.title"]}
            </h1>
            <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
              {t["community.desc"]}
            </p>
          </div>
          <Link
            href={`/${locale}/community/write`}
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 10,
              background: "#cc8844",
              color: "#0d0d1a",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ✏️ {t["community.write"]}
          </Link>
        </div>

        <PostList
          locale={locale}
          initialPosts={posts}
          initialTotal={total}
          initialPage={1}
          initialTotalPages={totalPages}
        />
      </div>
    </div>
  );
}
