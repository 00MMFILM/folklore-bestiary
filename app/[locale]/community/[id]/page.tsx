import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, getDictionary, type Locale } from "@/lib/i18n";
import { getAdminClient } from "@/lib/supabase";
import { GENRES } from "@/lib/community-types";
import PostActions from "./PostActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const l = isValidLocale(locale) ? locale : "ko";
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("community_posts")
    .select("title, nickname")
    .eq("id", id)
    .single();

  if (!data) return { title: "Not Found" };
  const t = getDictionary(l);
  return {
    title: `${data.title} | ${t["community.title"]}`,
    description: `${data.nickname} — ${t["community.title"]}`,
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ko";
  const t = getDictionary(locale);

  const supabase = getAdminClient();

  // Increment view + fetch
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, locale, nickname, title, content, genre, creature_ids, view_count, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!post) notFound();

  // Increment view count
  await supabase
    .from("community_posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", id);

  const genre = GENRES.find((g) => g.id === post.genre);
  const genreLabel = genre ? `${genre.icon} ${locale === "ko" ? genre.ko : genre.en}` : post.genre;

  const createdDate = new Date(post.created_at);
  const dateStr = createdDate.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

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

        {/* Post header */}
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{
              fontSize: 12, padding: "3px 10px", borderRadius: 6,
              background: "#cc884418", color: "#cc8844",
              border: "1px solid #cc884433",
            }}>
              {genreLabel}
            </span>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888" }}>
            <span style={{ fontWeight: 600, color: "#aaa" }}>{post.nickname}</span>
            <span>{dateStr}</span>
            <span>👁 {(post.view_count || 0) + 1} {t["community.views"]}</span>
          </div>
        </div>

        {/* Creature tags */}
        {post.creature_ids && post.creature_ids.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {post.creature_ids.map((cid: string) => (
              <Link
                key={cid}
                href={`/${locale}/creatures/${cid}`}
                style={{
                  display: "inline-block", padding: "3px 10px",
                  borderRadius: 12, fontSize: 12,
                  background: "#6cb4ee18", color: "#6cb4ee",
                  border: "1px solid #6cb4ee33", textDecoration: "none",
                }}
              >
                🏷️ {cid}
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: "24px 20px", borderRadius: 12,
            background: "#0d0d1a", border: "1px solid #1a1a2e",
            lineHeight: 1.8, fontSize: 15,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}
        >
          {post.content}
        </div>

        {/* Actions */}
        <PostActions locale={locale} postId={post.id} />
      </div>
    </div>
  );
}
