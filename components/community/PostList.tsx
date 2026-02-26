"use client";

import { useState, useEffect, useCallback } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { GENRES, type Genre, type PostListItem } from "@/lib/community-types";
import PostCard from "./PostCard";
import Pagination from "./Pagination";

interface PostListProps {
  locale: Locale;
  initialPosts: PostListItem[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

export default function PostList({
  locale, initialPosts, initialTotal, initialPage, initialTotalPages,
}: PostListProps) {
  const t = getDictionary(locale);
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [genre, setGenre] = useState<Genre | "">("");
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (p: number, g: Genre | "") => {
    setLoading(true);
    const params = new URLSearchParams({ locale, page: String(p) });
    if (g) params.set("genre", g);
    const res = await fetch(`/api/community/posts?${params}`);
    const data = await res.json();
    setPosts(data.posts);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setPage(data.page);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    fetchPosts(1, genre);
  }, [genre, fetchPosts]);

  function handlePageChange(p: number) {
    fetchPosts(p, genre);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Genre filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        <button
          onClick={() => setGenre("")}
          style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 13,
            border: genre === "" ? "1px solid #cc8844" : "1px solid #333",
            background: genre === "" ? "#cc884422" : "transparent",
            color: genre === "" ? "#cc8844" : "#888",
            cursor: "pointer",
          }}
        >
          {t["community.allGenres"]}
        </button>
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => setGenre(g.id)}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13,
              border: genre === g.id ? "1px solid #cc8844" : "1px solid #333",
              background: genre === g.id ? "#cc884422" : "transparent",
              color: genre === g.id ? "#cc8844" : "#888",
              cursor: "pointer",
            }}
          >
            {g.icon} {locale === "ko" ? g.ko : g.en}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        {total} {locale === "ko" ? "개의 글" : "posts"}
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#888", fontSize: 16 }}>{t["community.noPosts"]}</p>
          <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>{t["community.firstPost"]}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} locale={locale} onPageChange={handlePageChange} />
    </div>
  );
}
