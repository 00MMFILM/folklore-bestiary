import styles from "./FundingReference.module.css";

const programs = [
  {
    title: "전통 기록문화 활용 대학생 콘텐츠 공모전",
    organization: "한국국학진흥원",
    audience: "대학·대학원생 2–5인 팀",
    use: "제공된 전통 기록을 바탕으로 영화·드라마 등의 기획을 개발하는 공모전입니다. 일반 개인이나 기업을 위한 상시 제작비 지원은 아닙니다.",
    conditions: "2026년 접수는 5월 8일 마감. 공개 안내에서 AI 사용 조건은 확인하지 못했습니다.",
    url: "https://story.ugyo.net/front/contest/ctMain.do?bbsCode=1006&ctIdx=1",
  },
  {
    title: "한국영화 기획개발지원 작가부문 · 하반기",
    organization: "영화진흥위원회",
    audience: "공고의 경력 또는 신인 작가 요건을 충족하는 신청자",
    use: "장편영화 개발을 위한 지원입니다. 장르나 소재가 한국 설화라는 이유만으로 신청 자격이 생기지는 않습니다.",
    conditions: "2026년 연장 접수는 7월 13일 마감. 각색 허용 범위와 AI 이용 조건은 세부 요강을 추가 확인해야 합니다.",
    url: "https://www.kofic.kr/kofic/business/prom/promotionBoardDetail.do?seqNo=18632",
  },
  {
    title: "대한민국 콘텐츠대상 · 스토리부문",
    organization: "한국콘텐츠진흥원",
    audience: "대한민국 국적의 개인·팀·법인 등 공고상 신청 대상",
    use: "2026년 공고는 원작이 있는 작품의 출품을 제한하고, AI 생성·제작 작품 관련 제외 조건도 명시했습니다. 설화 각색이나 AI 활용 초안을 바로 제출할 수 있다고 가정하면 안 됩니다.",
    conditions: "2026년 접수는 5월 19일 마감. 해당 작품과 작업 방식의 적합성을 주최 측에 확인해야 합니다.",
    url: "https://storyum.kr/storymobile/progrm/master/view.do?prgSn=952&menuNo=400040",
  },
  {
    title: "문화기술 콘텐츠 제작지원",
    organization: "경기콘텐츠진흥원",
    audience: "경기도 소재·이전 조건 등을 충족하는 중소 법인기업",
    use: "문화기술 콘텐츠나 솔루션을 만드는 기업을 위한 사업입니다. 작가의 시나리오 개발 지원과 별도로 검토해야 합니다.",
    conditions: "2026년 접수는 5월 12일 마감. 분야별 금액과 이전·수행 조건은 공고 원문에서 확인해야 합니다.",
    url: "https://www.gcon.or.kr/gcon/business/gconNotice/view.do?menuNo=200061&pageIndex=1&pbancSrnm=11165",
  },
];

export default function FundingReference() {
  return <section className={styles.section} aria-labelledby="funding-title">
    <p className={styles.label}>기획 다음의 참고 자료</p>
    <h2 id="funding-title">어떤 지원이 이 작품에 맞을까요?</h2>
    <p className={styles.intro}>아래는 2026년 공고를 확인한 참고 목록입니다. <strong>모두 접수가 끝났으며, 2027년 모집 일정은 확인되지 않았습니다.</strong> 작품 개발 지원과 기업 지원을 나눠 보고, 새 공고의 자격·원작·AI 조건을 먼저 확인하세요.</p>
    <p className={styles.checked}>확인일: 2026년 10월 24일 · 실시간 공고 목록이 아닙니다.</p>
    <div className={styles.grid}>{programs.map((program) => <article key={program.url}>
      <p className={styles.organization}>{program.organization} <span>2026 접수 종료</span></p>
      <h3>{program.title}</h3>
      <p className={styles.audience}>{program.audience}</p>
      <p>{program.use}</p><p>{program.conditions}</p>
      <a href={program.url} target="_blank" rel="noopener noreferrer">공식 공고 확인 ↗<span className={styles.srOnly}> (새 탭)</span></a>
    </article>)}</div>
  </section>;
}
