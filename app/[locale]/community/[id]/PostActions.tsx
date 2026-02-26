"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import PasswordModal from "@/components/community/PasswordModal";

interface PostActionsProps {
  locale: Locale;
  postId: string;
}

export default function PostActions({ locale, postId }: PostActionsProps) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(password: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "Wrong password" ? t["community.wrongPassword"] : data.error);
        setLoading(false);
        return;
      }

      if (modal === "edit") {
        sessionStorage.setItem(`pw_${postId}`, password);
        router.push(`/${locale}/community/${postId}/edit`);
      } else if (modal === "delete") {
        const delRes = await fetch(`/api/community/posts/${postId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (delRes.ok) {
          router.push(`/${locale}/community`);
        } else {
          const delData = await delRes.json();
          setError(delData.error);
        }
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
        <button
          onClick={() => { setModal("edit"); setError(""); }}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid #333", background: "transparent",
            color: "#888", cursor: "pointer", fontSize: 13,
          }}
        >
          ✏️ {t["community.edit"]}
        </button>
        <button
          onClick={() => { setModal("delete"); setError(""); }}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid #ff444444", background: "#ff444412",
            color: "#ff6666", cursor: "pointer", fontSize: 13,
          }}
        >
          🗑️ {t["community.delete"]}
        </button>
      </div>

      {modal && (
        <PasswordModal
          locale={locale}
          onConfirm={handleVerify}
          onCancel={() => { setModal(null); setError(""); }}
          error={error}
          loading={loading}
        />
      )}
    </>
  );
}
