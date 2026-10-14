import type { Locale } from "@/lib/i18n";
import { EncounterSampleLink, EncounterView } from "./EncounterAnalytics";

const copy = {
  ko: { title: "이 설화로 플레이하기", body: "철을 먹는 괴물 때문에 생계가 위협받는 마을. 전승 해설과 창작 시나리오를 구분한 영어 TRPG 샘플입니다.", action: "영어 무료 샘플 읽기", note: "웹 전문 · PDF 6쪽 · 회원가입 없이 이용" },
  en: { title: "Bring this folklore to your table", body: "An iron-eating creature threatens a village’s tools and harvest. A system-neutral encounter with clearly separated folklore notes and original game material.", action: "Read the free encounter", note: "Full web sample · 6-page PDF · No sign-up" },
  ja: { title: "この伝承をゲームで楽しむ", body: "鉄を食べる怪物が村の農具と暮らしを脅かす。伝承の解説と創作部分を区別した、英語のTRPG用サンプルです。", action: "英語の無料サンプルを読む", note: "全文公開 · PDF 6ページ · 登録不要" },
  zh: { title: "将这个传说带到游戏桌上", body: "一只食铁怪物威胁着村庄的农具和收成。这份英文桌上角色扮演游戏样本明确区分传说资料与原创情节。", action: "阅读免费英文样本", note: "网页全文 · 6页PDF · 无需注册" },
} satisfies Record<Locale, { title: string; body: string; action: string; note: string }>;

export function isBulgasari(id: string) {
  return ["kr-bulgasari", "kr-balgasari", "kr-bulgasari-creature"].includes(id);
}

export default function BulgasariSampleCard({ locale, creatureId }: { locale: Locale; creatureId: string }) {
  const text = copy[locale];
  return (
    <aside aria-labelledby="encounter-sample-title" style={{ marginBottom: 32, padding: 24, background: "#e7bc8312", border: "1px solid #e7bc8355", borderRadius: 12 }}>
      <EncounterView stage="detail" locale={locale} creatureId={creatureId} />
      <h2 id="encounter-sample-title" style={{ fontSize: 20, fontWeight: 700, color: "#e7bc83", marginBottom: 10 }}>{text.title}</h2>
      <p style={{ lineHeight: 1.7, color: "#ddd", marginBottom: 16 }}>{text.body}</p>
      <EncounterSampleLink locale={locale}>{text.action}</EncounterSampleLink>
      <p style={{ marginTop: 12, fontSize: 13, color: "#b7aa99" }}>{text.note}</p>
    </aside>
  );
}
