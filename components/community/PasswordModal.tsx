"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface PasswordModalProps {
  locale: Locale;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
}

export default function PasswordModal({ locale, onConfirm, onCancel, error, loading }: PasswordModalProps) {
  const t = getDictionary(locale);
  const [password, setPassword] = useState("");

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a2e", borderRadius: 14,
          border: "1px solid #333", padding: 24,
          width: "90%", maxWidth: 340,
        }}
      >
        <h3 style={{ color: "#eed8c0", margin: "0 0 8px", fontSize: 16 }}>
          {t["community.enterPassword"]}
        </h3>
        <p style={{ color: "#888", margin: "0 0 16px", fontSize: 13 }}>
          {t["community.passwordHint"]}
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && password.length === 4 && onConfirm(password)}
          placeholder={t["community.passwordPlaceholder"]}
          autoFocus
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: error ? "1px solid #ff4444" : "1px solid #333",
            background: "#0d0d1a", color: "#eed8c0", fontSize: 18,
            textAlign: "center", letterSpacing: 8, boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#ff6666", fontSize: 12, margin: "8px 0 0" }}>{error}</p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #333",
              background: "transparent", color: "#888", cursor: "pointer", fontSize: 13,
            }}
          >
            {t["community.cancel"]}
          </button>
          <button
            onClick={() => password.length === 4 && onConfirm(password)}
            disabled={password.length !== 4 || loading}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: password.length === 4 && !loading ? "#cc8844" : "#333",
              color: password.length === 4 && !loading ? "#0d0d1a" : "#666",
              cursor: password.length === 4 && !loading ? "pointer" : "default",
              fontSize: 13, fontWeight: 600,
            }}
          >
            {loading ? "..." : t["community.enterPassword"]}
          </button>
        </div>
      </div>
    </div>
  );
}
