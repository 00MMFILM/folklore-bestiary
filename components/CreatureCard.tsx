import Link from "next/link";
import { getCreatureImage } from "@/lib/folklore-data";
import type { Locale } from "@/lib/i18n";
import { getRegionColors } from "@/lib/region-colors";

interface CreatureCardProps {
  id: string;
  name: string;
  localName?: string;
  type: string;
  fear: number;
  region: string;
  country: string;
  locale: Locale;
}

export default function CreatureCard({
  id,
  name,
  localName,
  type,
  fear,
  region,
  country,
  locale,
}: CreatureCardProps) {
  const image = getCreatureImage(id);
  const colors = getRegionColors(region);

  return (
    <Link
      href={`/${locale}/creatures/${id}`}
      style={{
        display: "block",
        background: `${colors.bg}cc`,
        border: `1px solid ${colors.accent}33`,
        borderRadius: "12px",
        overflow: "hidden",
        textDecoration: "none",
        color: "#eed8c0",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {image && (
        <div style={{ width: "100%", aspectRatio: "1", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            width={300}
            height={300}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
      {!image && (
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0a0a 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            color: `${colors.accent}44`,
          }}
        >
          ?
        </div>
      )}
      <div style={{ padding: "12px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            margin: "0 0 4px",
            color: colors.accent,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {localName || name}
        </h3>
        <p
          style={{
            fontSize: "12px",
            margin: "0 0 8px",
            color: "#999",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              background: `${colors.accent}22`,
              color: colors.accent,
              padding: "2px 8px",
              borderRadius: "10px",
              border: `1px solid ${colors.accent}33`,
            }}
          >
            {type}
          </span>
          <span
            style={{
              fontSize: "11px",
              background: fear >= 7 ? "#ff000022" : "#ffaa0022",
              color: fear >= 7 ? "#ff4444" : "#ffaa44",
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            {fear}/10
          </span>
          <span
            style={{
              fontSize: "11px",
              background: "#ffffff11",
              padding: "2px 8px",
              borderRadius: "10px",
              color: "#888",
            }}
          >
            {country}
          </span>
        </div>
      </div>
    </Link>
  );
}
