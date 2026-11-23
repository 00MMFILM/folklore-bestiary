import { getCreatureImage } from "@/lib/folklore-data";
import { getEditorialImage } from "@/lib/editorial-images";
import { GROWTH_CAMPAIGN_ID } from "@/lib/growth-campaign";
import { GrowthLink } from "./GrowthAnalytics";
import styles from "./CountryReadingCards.module.css";

export default function CountryReadingCards({ picks, page, locale }: {
  picks: { id: string; label: string; reason: string }[];
  page: string;
  locale: string;
}) {
  return <nav aria-label="그림으로 고르는 한국 설화" className={styles.reading}>
    <h2>어떤 이야기부터 읽을까?</h2>
    <div className={styles.grid}>
      {picks.map(pick => {
        const editorialImage = getEditorialImage(pick.id, locale);
        const image = editorialImage?.smallSrc || getCreatureImage(pick.id);
        return <GrowthLink key={pick.id} href={`/${locale}/creatures/${pick.id}`}
          page={page} campaign={GROWTH_CAMPAIGN_ID}>
          <span className={styles.card}>
            {image && <span className={styles.art}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={editorialImage?.alt || `${pick.label} 창작 일러스트`}
                width={300} height={200} loading="lazy" decoding="async" />
            </span>}
            <span className={styles.copy}>
              <strong>{pick.label}</strong>
              <span>{pick.reason}</span>
              <span className={styles.action}>이야기 읽기 <span aria-hidden="true">↗</span></span>
            </span>
          </span>
        </GrowthLink>;
      })}
    </div>
  </nav>;
}
