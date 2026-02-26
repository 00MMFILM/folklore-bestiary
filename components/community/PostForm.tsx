"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { GENRES, type Genre } from "@/lib/community-types";
import CreatureTagPicker from "./CreatureTagPicker";

interface PostFormProps {
  locale: Locale;
  mode: "create" | "edit";
  postId?: string;
  initial?: {
    nickname: string;
    title: string;
    content: string;
    genre: Genre;
    creature_ids: string[];
  };
}

export default function PostForm({ locale, mode, postId, initial }: PostFormProps) {
  const t = getDictionary(locale);
  const router = useRouter();

  const [nickname, setNickname] = useState(initial?.nickname || "");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [genre, setGenre] = useState<Genre>(initial?.genre || "free");
  const [creatureIds, setCreatureIds] = useState<string[]>(initial?.creature_ids || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) { setError(t["community.nickname"]); return; }
    if (!/^\d{4}$/.test(password)) { setError(t["community.passwordPlaceholder"]); return; }
    if (!title.trim()) { setError(t["community.titleField"]); return; }
    if (!content.trim()) { setError(t["community.content"]); return; }

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, nickname: nickname.trim(), password, title: title.trim(), content: content.trim(), genre, creature_ids: creatureIds }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        router.push(`/${locale}/community/${data.id}`);
      } else {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, title: title.trim(), content: content.trim(), genre, creature_ids: creatureIds }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error === "Wrong password" ? t["community.wrongPassword"] : data.error);
          setLoading(false);
          return;
        }
        router.push(`/${locale}/community/${postId}`);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #333", background: "#0d0d1a",
    color: "#eed8c0", fontSize: 14, boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6, color: "#888",
    fontSize: 13, fontWeight: 600,
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>{t["community.nickname"]}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder={t["community.nicknamePlaceholder"]}
            disabled={mode === "edit"}
            style={{ ...inputStyle, ...(mode === "edit" ? { opacity: 0.5 } : {}) }}
          />
        </div>
        <div>
          <label style={labelStyle}>{t["community.password"]}</label>
          <input
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            placeholder={t["community.passwordPlaceholder"]}
            style={{ ...inputStyle, letterSpacing: 6, textAlign: "center" }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{t["community.genre"]}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGenre(g.id)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 13,
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
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{t["community.titleField"]}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder={t["community.titlePlaceholder"]}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{t["community.content"]}</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={10000}
          rows={12}
          placeholder={t["community.contentPlaceholder"]}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>{t["community.creatures"]}</label>
        <CreatureTagPicker locale={locale} selected={creatureIds} onChange={setCreatureIds} />
      </div>

      {error && (
        <p style={{ color: "#ff6666", fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "1px solid #333",
            background: "transparent", color: "#888", cursor: "pointer", fontSize: 14,
          }}
        >
          {t["community.cancel"]}
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: loading ? "#333" : "#cc8844",
            color: loading ? "#666" : "#0d0d1a",
            cursor: loading ? "default" : "pointer",
            fontSize: 14, fontWeight: 700,
          }}
        >
          {loading ? "..." : mode === "create" ? t["community.submit"] : t["community.save"]}
        </button>
      </div>
    </form>
  );
}
