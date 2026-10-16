import type { Locale } from "@/lib/i18n";
import { EncounterPromoLink, EncounterPromoSurface } from "./EncounterAnalytics";
import styles from "./EncounterPromoCard.module.css";

const copy = {
  ko: {
    title: "불가사리로 시작하는 짧은 모험",
    description: "영어 TRPG 모험 · 무료 PDF 6쪽 · 가입 없음",
    action: "무료 모험 읽기",
  },
  en: {
    title: "A short adventure with Bulgasari",
    description: "English tabletop RPG encounter · Free 6-page PDF · No sign-up",
    action: "Read the free adventure",
  },
  ja: {
    title: "プルガサリと始める短い冒険",
    description: "英語のTRPGシナリオ · 無料PDF 6ページ · 登録不要",
    action: "無料の冒険を読む",
  },
  zh: {
    title: "Bulgasari：一场简短冒险",
    description: "英文桌上角色扮演冒险 · 免费6页PDF · 无需注册",
    action: "阅读免费冒险",
  },
} satisfies Record<Locale, { title: string; description: string; action: string }>;

export default function EncounterPromoCard({
  locale,
  placement,
}: {
  locale: Locale;
  placement: "home" | "korea";
}) {
  const text = copy[locale];
  const titleId = `encounter-promo-${placement}-title`;

  return (
    <EncounterPromoSurface locale={locale} placement={placement}>
      <aside className={styles.card} aria-labelledby={titleId} lang={locale}>
        <div className={styles.copy}>
          <h2 className={styles.title} id={titleId}>{text.title}</h2>
          <p className={styles.description}>{text.description}</p>
        </div>
        <EncounterPromoLink locale={locale} placement={placement} className={styles.link}>
          {text.action}<span aria-hidden="true">→</span>
        </EncounterPromoLink>
      </aside>
    </EncounterPromoSurface>
  );
}
