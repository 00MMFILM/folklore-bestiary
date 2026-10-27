"use client";

import { inject, track } from "@vercel/analytics";
import { useEffect, useRef, useState, type ReactNode } from "react";

type GuideLocale = "en" | "ko";
const GUIDE_ID = "korean-folklore";
const RELEASE_URL = "https://www.threads.com/@mythoriaworldatlas";

function record(name: string, locale: GuideLocale, action: string) {
  try {
    inject({ framework: "next", disableAutoTrack: true, basePath: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH });
    // These are page mounts and link/button activations, never purchases,
    // completed downloads, completed shares or confirmed follows.
    track(name, { guide_id: GUIDE_ID, action: `${locale}:${action}` });
  } catch {
    // Analytics must not interrupt the native reading or download flow.
  }
}

export function GuideView({ locale }: { locale: GuideLocale }) {
  const recorded = useRef<GuideLocale | null>(null);
  useEffect(() => {
    if (recorded.current === locale) return;
    recorded.current = locale;
    record("guide_view", locale, "page_mount");
  }, [locale]);
  return null;
}

export function GuideDownloadLink({ locale, className, children }: { locale: GuideLocale; className?: string; children: ReactNode }) {
  return <a href="/samples/korean-folklore-preview.pdf" download="korean-folklore-preview.pdf" className={className} onClick={() => record("guide_preview_click", locale, "download_click")}>{children}</a>;
}

export function GuideReleaseLink({ locale, className, children }: { locale: GuideLocale; className?: string; children: ReactNode }) {
  return <a href={RELEASE_URL} target="_blank" rel="noopener noreferrer" className={className} onClick={() => record("guide_release_click", locale, "outbound_click")}>{children}</a>;
}

export function GuideShareButton({ locale, url, className }: { locale: GuideLocale; url: string; className?: string }) {
  const [status, setStatus] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const [sharing, setSharing] = useState(false);
  async function share() {
    if (sharing) return;
    record("guide_share_click", locale, "share_click");
    setSharing(true);
    setStatus("");
    setManualCopy(false);
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: "Korean Folklore: Beyond the Screen", url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setStatus(locale === "ko" ? "링크를 복사했습니다." : "Link copied.");
      } catch {
        setManualCopy(true);
        setStatus(locale === "ko" ? "아래 링크를 선택해 복사해 주세요." : "Select and copy the link below.");
      }
    } finally {
      setSharing(false);
    }
  }
  return <div>
    <button type="button" className={className} onClick={share} disabled={sharing}>{locale === "ko" ? "가이드 공유하기" : "Share this guide"} <span aria-hidden="true">↗</span></button>
    <span role="status" aria-live="polite" style={{ display: "block", fontSize: 13, marginTop: status ? 8 : 0 }}>{status}</span>
    {manualCopy && <input aria-label={locale === "ko" ? "복사할 가이드 주소" : "Guide link to copy"} readOnly value={url} onFocus={(event) => event.currentTarget.select()} style={{ width: "100%", maxWidth: 460, padding: 10, marginTop: 8, border: "1px solid currentColor", color: "inherit", background: "transparent" }} />}
  </div>;
}
