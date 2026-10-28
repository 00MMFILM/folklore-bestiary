import Link from "next/link";
import styles from "../GuidePromoCard.module.css";

export default function WriterStudioPromo() {
  return <aside className={styles.card} lang="ko">
    <div><p className={styles.label}>작가를 위한 설화 작업실</p><h2 className={styles.title}>원전에서, 인물의 선택으로.</h2><p className={styles.description}>출처가 있는 설화 3편에서 출발해 갈등과 시퀀스를 쓰고, 기획 초안을 보관하세요.</p></div>
    <Link className={styles.link} href="/ko/studio" prefetch={false}>작업실 열기<span aria-hidden="true">↗</span></Link>
  </aside>;
}
