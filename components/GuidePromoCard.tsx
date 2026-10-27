import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import styles from "./GuidePromoCard.module.css";

export const KOREAN_GUIDE_CREATURE_IDS = ["kr-dokkaebi", "kr-gumiho", "kr-jeoseung-saja", "kr-bulgasari", "kr-haetae", "kr-imugi"];

const copy = {
  ko: { label: "새로운 읽을거리", title: "화면 너머의 한국 설화", description: "도깨비부터 이무기까지, 여섯 존재를 만나는 영문 입문 가이드. 무료 미리보기 PDF를 읽어보세요.", action: "가이드 미리보기" },
  en: { label: "A new way to explore", title: "Korean folklore, beyond the screen", description: "Meet six figures, from Dokkaebi to Imugi. An English introduction with a free preview PDF.", action: "Explore the guide" },
  ja: { label: "新しい読みもの", title: "画面の向こうの韓国伝承", description: "トッケビからイムギまで、6つの存在を紹介する英語ガイド。無料プレビューPDF付き。", action: "英語ガイドを見る" },
  zh: { label: "全新读物", title: "走进银幕之外的韩国传说", description: "从Dokkaebi到Imugi，认识六种传说中的存在。英文入门指南，附免费预览PDF。", action: "查看英文指南" },
} satisfies Record<Locale, { label: string; title: string; description: string; action: string }>;

export default function GuidePromoCard({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return <aside className={styles.card} lang={locale}>
    <div><p className={styles.label}>{text.label}</p><h2 className={styles.title}>{text.title}</h2><p className={styles.description}>{text.description}</p></div>
    <Link className={styles.link} href={`/${locale === "ko" ? "ko" : "en"}/guides/korean-folklore`} prefetch={false}>{text.action}<span aria-hidden="true">↗</span></Link>
  </aside>;
}
