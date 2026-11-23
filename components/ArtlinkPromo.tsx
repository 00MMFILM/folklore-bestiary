"use client";

import { inject, track } from "@vercel/analytics";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./ArtlinkPromo.module.css";

const copy = {
  ko: {
    label: "광고 · 운영사 서비스",
    title: "떠오른 장면을, 다음 연습으로.",
    description: "아트링크에서 창작·연습 기록을 남기고 AI 피드백을 받아보세요.",
    action: "아트링크 둘러보기",
  },
  en: {
    label: "Ad · From our team",
    title: "Take an idea into your next practice.",
    description: "Keep creative practice notes and get AI feedback with Artlink.",
    action: "Explore Artlink",
  },
  ja: {
    label: "広告 · 運営元のサービス",
    title: "浮かんだ場面を、次の練習へ。",
    description: "Artlinkで創作や練習を記録し、AIのフィードバックを受け取れます。",
    action: "Artlinkを見る",
  },
  zh: {
    label: "广告 · 运营方服务",
    title: "把灵感带入下一次练习。",
    description: "在Artlink记录创作与练习，获取AI反馈。",
    action: "了解Artlink",
  },
} satisfies Record<Locale, { label: string; title: string; description: string; action: string }>;

function record(event: "artlink_promo_view" | "artlink_promo_click", locale: Locale, placement: string) {
  try {
    if (new URLSearchParams(window.location.search).get("growth_qa") === "1") {
      sessionStorage.setItem("artlink_promo_qa", "1");
      return;
    }
    if (sessionStorage.getItem("artlink_promo_qa") === "1") return;
    inject({ framework: "next", disableAutoTrack: true,
      basePath: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH });
    track(event, { locale, placement, page: window.location.pathname, campaign: "artlink_20261123" });
  } catch { /* The link still works if analytics or storage is blocked. */ }
}

export default function ArtlinkPromo({ locale, placement }: {
  locale: Locale;
  placement: "creature" | "country";
}) {
  const card = useRef<HTMLElement>(null);
  const text = copy[locale];
  const href = `https://art-link.kr/launch${locale === "ko" ? "" : "/en/"}?utm_source=folklore_bestiary&utm_medium=referral&utm_campaign=artlink_20261123&utm_content=${placement}_${locale}`;

  useEffect(() => {
    if (!card.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
      record("artlink_promo_view", locale, placement);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(card.current);
    return () => observer.disconnect();
  }, [locale, placement]);

  return (
    <aside ref={card} className={styles.card} aria-label={`Artlink · ${text.label}`} lang={locale}>
      <div className={styles.copy}>
        <p className={styles.label}>{text.label}</p>
        <p className={styles.title}>{text.title}</p>
        <p className={styles.description}>{text.description}</p>
      </div>
      <a href={href} target="_blank" rel="sponsored noopener noreferrer" className={styles.link}
        onClick={() => record("artlink_promo_click", locale, placement)}>
        {text.action}<span aria-hidden="true"> ↗</span>
      </a>
    </aside>
  );
}
