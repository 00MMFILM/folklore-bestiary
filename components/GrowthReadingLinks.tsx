import { GrowthLink } from "./GrowthAnalytics";
import { GROWTH_CAMPAIGN_ID } from "@/lib/growth-campaign";
export default function GrowthReadingLinks({ page, locale, links }: {
  page: string; locale: string; links: { href: string; label: string }[];
}) {
  return <nav aria-label={locale === "ko" ? "다음으로 읽기" : "Read next"}
    style={{ margin: "24px 0 32px", padding: "16px 20px", border: "1px solid #edc58c44", borderRadius: 12 }}>
    <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{locale === "ko" ? "이어서 읽기" : "Keep exploring"}</h2>
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {links.map(link => <li key={link.href}><GrowthLink href={link.href} page={page} campaign={GROWTH_CAMPAIGN_ID}>{link.label}</GrowthLink></li>)}
      <li><GrowthLink href={locale === "ko" ? "/ko/studio" : "/en/encounters/bulgasari"} page={page} campaign={GROWTH_CAMPAIGN_ID}>
        {locale === "ko" ? "설화로 갈등과 시퀀스 쓰기 — 작가 작업실" : "From folklore to a playable story — free Bulgasari sample"}
      </GrowthLink></li>
    </ul>
  </nav>;
}
