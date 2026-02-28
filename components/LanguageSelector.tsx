import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const LANG_OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "ko", flag: "\uD83C\uDDF0\uD83C\uDDF7", label: "한국어" },
  { locale: "en", flag: "\uD83C\uDDFA\uD83C\uDDF8", label: "English" },
  { locale: "zh", flag: "\uD83C\uDDE8\uD83C\uDDF3", label: "中文" },
  { locale: "ja", flag: "\uD83C\uDDEF\uD83C\uDDF5", label: "日本語" },
];

export default function LanguageSelector({
  locale,
  basePath,
}: {
  locale: Locale;
  basePath: string;
}) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", padding: "8px 24px" }}>
      {LANG_OPTIONS.map((opt) => (
        <Link
          key={opt.locale}
          href={`/${opt.locale}${basePath}`}
          title={opt.label}
          style={{
            fontSize: "20px",
            textDecoration: "none",
            opacity: locale === opt.locale ? 1 : 0.4,
            filter: locale === opt.locale ? "none" : "grayscale(50%)",
            transition: "opacity 0.2s, filter 0.2s",
          }}
        >
          {opt.flag}
        </Link>
      ))}
    </div>
  );
}
