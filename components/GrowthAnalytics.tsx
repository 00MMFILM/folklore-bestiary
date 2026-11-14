"use client";
import { inject, track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

function record(event: string, page: string, campaign: string, target?: string) {
  try {
    const query = new URLSearchParams(window.location.search);
    if (query.get("growth_qa") === "1") return;
    const referrer = document.referrer ? new URL(document.referrer).hostname : "";
    const source = query.get("utm_source") === "threads" || /^(www\.)?threads\.(com|net)$/.test(referrer)
      ? "threads" : /(^|\.)(google\.[a-z.]+|naver\.com|bing\.com)$/.test(referrer)
        ? "search" : referrer === window.location.hostname ? "internal" : referrer ? "other" : "direct";
    inject({ framework: "next", disableAutoTrack: true,
      basePath: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH });
    track(event, { campaign, page, source, ...(target ? { target } : {}) });
  } catch { /* Reading and navigation work even when analytics is blocked. */ }
}
export function GrowthView({ page, campaign }: { page: string; campaign: string }) {
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;
    record("growth_page_view", page, campaign);
  }, [page, campaign]);
  return null;
}
export function GrowthLink({ href, page, campaign, children }: {
  href: string; page: string; campaign: string; children: ReactNode;
}) {
  return <Link href={href} prefetch={false}
    onClick={() => record("growth_next_click", page, campaign, href)}
    style={{ color: "#edc58c", textUnderlineOffset: 4, display: "inline-block", padding: "8px 0" }}>
    {children}
  </Link>;
}
