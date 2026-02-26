"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { GENRES, type PostListItem } from "@/lib/community-types";

interface PostCardProps {
  post: PostListItem;
  locale: Locale;
}

export default function PostCard({ post, locale }: PostCardProps) {
  const t = getDictionary(locale);
  const genre = GENRES.find((g) => g.id === post.genre);
  const genreLabel = genre ? `${genre.icon} ${locale === "ko" ? genre.ko : genre.en}` : post.genre;

  const date = new Date(post.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

  return (
    <Link
      href={`/${locale}/community/${post.id}`}
      style={{
        display: "block", padding: "14px 16px", borderRadius: 10,
        border: "1px solid #1a1a2e", background: "#0d0d1a",
        textDecoration: "none", transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cc884466")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a2e")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 6,
              background: "#cc884418", color: "#cc8844", border: "1px solid #cc884433",
            }}>
              {genreLabel}
            </span>
            {post.creature_ids.length > 0 && (
              <span style={{ fontSize: 11, color: "#666" }}>
                🏷️ {post.creature_ids.length}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 15, fontWeight: 600, color: "#eed8c0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {post.title}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, fontSize: 11, color: "#666" }}>
          <div>{post.nickname}</div>
          <div>{dateStr}</div>
          <div>👁 {post.view_count} {t["community.views"]}</div>
        </div>
      </div>
    </Link>
  );
}
