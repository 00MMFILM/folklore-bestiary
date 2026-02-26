"use client";

import { useState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface CreatureResult {
  id: string;
  name: string;
  localName?: string;
  country: string;
  region: string;
}

interface CreatureTagPickerProps {
  locale: Locale;
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function CreatureTagPicker({ locale, selected, onChange }: CreatureTagPickerProps) {
  const t = getDictionary(locale);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatureResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function search(q: string) {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/creatures/search?q=${encodeURIComponent(q)}`);
      const data: CreatureResult[] = await res.json();
      setResults(data.filter((c) => !selected.includes(c.id)));
      setOpen(true);
    }, 200);
  }

  function addCreature(id: string) {
    onChange([...selected, id]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeCreature(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selected.map((id) => (
            <span
              key={id}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 12, fontSize: 12,
                background: "#cc884418", color: "#cc8844",
                border: "1px solid #cc884433",
              }}
            >
              {id}
              <button
                onClick={() => removeCreature(id)}
                style={{
                  background: "none", border: "none", color: "#cc8844",
                  cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={t["community.searchCreature"]}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 8,
          border: "1px solid #333", background: "#0d0d1a",
          color: "#eed8c0", fontSize: 13, boxSizing: "border-box",
        }}
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            marginTop: 4, background: "#1a1a2e", border: "1px solid #333",
            borderRadius: 8, maxHeight: 200, overflowY: "auto", zIndex: 100,
          }}
        >
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => addCreature(c.id)}
              style={{
                display: "block", width: "100%", padding: "8px 12px",
                border: "none", borderBottom: "1px solid #1a1a2e",
                background: "transparent", color: "#eed8c0",
                cursor: "pointer", textAlign: "left", fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#cc884412")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 600 }}>{locale === "ko" && c.localName ? c.localName : c.name}</span>
              <span style={{ color: "#666", marginLeft: 8, fontSize: 11 }}>
                {c.country} · {c.region}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
