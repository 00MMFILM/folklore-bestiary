"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

const SAMPLE_ID = "bulgasari-01";

// Pageviews remain available through the root Analytics component. Custom
// events require Vercel Pro/Enterprise and an enabled Web Analytics project.
function record(name: string, properties: Record<string, string>) {
  try {
    track(name, { sample_id: SAMPLE_ID, ...properties });
  } catch {
    // A blocked analytics script must never prevent reading or downloading.
  }
}

export function EncounterView({
  stage,
  locale,
  creatureId = "kr-bulgasari",
}: {
  stage: "detail" | "sample";
  locale: string;
  creatureId?: string;
}) {
  const lastView = useRef<string | null>(null);
  useEffect(() => {
    const key = `${stage}:${locale}:${creatureId}`;
    if (lastView.current === key) return;
    lastView.current = key;
    record(`encounter_${stage}_view`, { locale });
  }, [stage, locale, creatureId]);
  return null;
}

export function EncounterSampleLink({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  return (
    <Link
      href="/en/encounters/bulgasari"
      prefetch={false}
      onClick={() => record("encounter_sample_click", { locale })}
      style={{ display: "inline-block", padding: "12px 18px", borderRadius: 8, background: "#e7bc83", color: "#21170e", fontWeight: 700, textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}

export function EncounterDownloadLink({
  children,
  className,
  placement = "sample",
}: {
  children: ReactNode;
  className?: string;
  placement?: "sample" | "sample_footer";
}) {
  return (
    <a
      href="/samples/bulgasari-free-sample.pdf"
      download="bulgasari-free-sample.pdf"
      className={className}
      onClick={() => record("encounter_pdf_click", { placement })}
    >
      {children}
    </a>
  );
}
