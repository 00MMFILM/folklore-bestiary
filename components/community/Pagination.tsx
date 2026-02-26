"use client";

import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface PaginationProps {
  page: number;
  totalPages: number;
  locale: Locale;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, locale, onPageChange }: PaginationProps) {
  const t = getDictionary(locale);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", marginTop: 24 }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{
          padding: "6px 14px", borderRadius: 8, border: "1px solid #333",
          background: "transparent", color: page <= 1 ? "#444" : "#eed8c0",
          cursor: page <= 1 ? "default" : "pointer", fontSize: 13,
        }}
      >
        {t["community.prev"]}
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} style={numStyle(false)}>1</button>
          {start > 2 && <span style={{ color: "#555" }}>…</span>}
        </>
      )}
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)} style={numStyle(p === page)}>
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: "#555" }}>…</span>}
          <button onClick={() => onPageChange(totalPages)} style={numStyle(false)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          padding: "6px 14px", borderRadius: 8, border: "1px solid #333",
          background: "transparent", color: page >= totalPages ? "#444" : "#eed8c0",
          cursor: page >= totalPages ? "default" : "pointer", fontSize: 13,
        }}
      >
        {t["community.next"]}
      </button>
    </div>
  );
}

function numStyle(active: boolean): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 8,
    border: active ? "1px solid #cc8844" : "1px solid #333",
    background: active ? "#cc884422" : "transparent",
    color: active ? "#cc8844" : "#888",
    cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
  };
}
