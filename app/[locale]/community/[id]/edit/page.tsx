"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { isValidLocale, getDictionary, type Locale } from "@/lib/i18n";
import type { PostDetail } from "@/lib/community-types";
import PostForm from "@/components/community/PostForm";

export default function EditPage() {
  const params = useParams();
  const rawLocale = params.locale as string;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ko";
  const postId = params.id as string;
  const t = getDictionary(locale);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
      setLoading(false);
    }
    load();
  }, [postId]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1410 0%, #0a0a0a 100%)",
        color: "#888", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        ...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1410 0%, #0a0a0a 100%)",
        color: "#888", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        Post not found
      </div>
    );
  }

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
          href={`/${locale}/community/${postId}`}
          style={{ color: "#888", fontSize: 13, textDecoration: "none" }}
        >
          {t["community.back"]}
        </Link>
        <h1 style={{ margin: "12px 0 24px", fontSize: 22, fontWeight: 700 }}>
          ✏️ {t["community.edit"]}
        </h1>
        <PostForm
          locale={locale}
          mode="edit"
          postId={postId}
          initial={{
            nickname: post.nickname,
            title: post.title,
            content: post.content,
            genre: post.genre,
            creature_ids: post.creature_ids,
          }}
        />
      </div>
    </div>
  );
}
