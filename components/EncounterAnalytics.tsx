"use client";

import { inject, track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

const SAMPLE_ID = "bulgasari-01";

// Pageviews remain available through the root Analytics component. Custom
// events require Vercel Pro/Enterprise and an enabled Web Analytics project.
function record(name: string, properties: Record<string, string>) {
  try {
    // A mount event can run before the root Analytics effect. Its SDK drops
    // events without a queue, so initialize it idempotently before tracking.
    // Next's Analytics component still owns route pageviews.
    inject({
      framework: "next",
      disableAutoTrack: true,
      basePath: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH,
    });
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

type PromoPlacement = "home" | "korea";

export function EncounterPromoSurface({
  locale,
  placement,
  children,
}: {
  locale: string;
  placement: PromoPlacement;
  children: ReactNode;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const viewedPlacements = useRef(new Set<string>());

  useEffect(() => {
    const element = surface.current;
    const key = `${placement}_${locale}`;
    if (!element || viewedPlacements.current.has(key) || typeof IntersectionObserver === "undefined") return;

    let active = true;
    let inView = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cancelTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const onIntersection = (entries: IntersectionObserverEntry[]) => {
      if (!active || document.visibilityState !== "visible") {
        inView = false;
        cancelTimer();
        return;
      }
      for (const entry of entries) {
        if (entry.target !== element) continue;
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (!inView) {
          cancelTimer();
          continue;
        }
        if (timer !== null || viewedPlacements.current.has(key)) continue;
        const pendingTimer = setTimeout(() => {
          if (!active) return;
          // Drain a queued exit before counting at the one-second boundary.
          onIntersection(observer.takeRecords());
          if (timer !== pendingTimer || !inView || document.visibilityState !== "visible") return;
          timer = null;
          viewedPlacements.current.add(key);
          record("encounter_promo_view", { placement: key });
          observer.disconnect();
          document.removeEventListener("visibilitychange", onVisibilityChange);
        }, 1000);
        timer = pendingTimer;
      }
    };
    const observer = new IntersectionObserver(onIntersection, { threshold: 0.5 });
    const onVisibilityChange = () => {
      cancelTimer();
      inView = false;
      observer.disconnect();
      observer.takeRecords();
      // A returning tab needs a fresh intersection, not pre-hide geometry.
      if (document.visibilityState === "visible") observer.observe(element);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    onVisibilityChange();

    return () => {
      active = false;
      cancelTimer();
      observer.disconnect();
      observer.takeRecords();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [locale, placement]);

  return <div ref={surface}>{children}</div>;
}

export function EncounterPromoLink({
  locale,
  placement,
  children,
  className,
}: {
  locale: string;
  placement: PromoPlacement;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/en/encounters/bulgasari"
      prefetch={false}
      className={className}
      onClick={() => record("encounter_promo_click", { placement: `${placement}_${locale}` })}
    >
      {children}
    </Link>
  );
}
