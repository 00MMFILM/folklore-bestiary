import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { GuideDownloadLink, GuideReleaseLink, GuideShareButton, GuideView } from "@/components/GuideActions";
import guideData from "@/content/guides/korean-folklore.json";
import styles from "./guide.module.css";

type GuideSource = { id: string; title: string; organization: string; url: string; accessed: string; note: string };
type GuideDetail = { sections: { title: string; body: string }[]; variation: string; screenLens: string; visualNote: string; sourceIds: string[]; question: string };
type GuideEntry = { id: string; english: string; korean: string; romanization: string; tagline: string; kind: string; summary: string } & Partial<GuideDetail>;
type GuideContent = { title: string; subtitle: string; intro: string[]; entries: GuideEntry[]; sources: GuideSource[]; editorialNote: string };

// The repository contains preview-only JSON: six short introductions and the
// free Dokkaebi chapter. The other five full entries and full PDF are kept
// outside the repository, rather than relying on server rendering for secrecy.
const guide: GuideContent = guideData;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app").replace(/\/$/, "");
const route = (locale: string) => `${SITE_URL}/${locale}/guides/korean-folklore`;

export function generateStaticParams() { return [{ locale: "en" }, { locale: "ko" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const language = locale === "ko" ? "ko" : "en";
  const title = language === "ko" ? "화면 너머의 한국 설화 — 영문 입문 가이드" : `${guide.title} — A Free Preview`;
  const description = language === "ko" ? "도깨비, 구미호, 저승사자, 불가사리, 해태, 이무기. 전승과 현대의 해석을 구분하는 영문 입문 가이드의 무료 미리보기입니다." : "Meet Dokkaebi, Gumiho, Jeoseung Saja, Bulgasari, Haetae and Imugi. An illustrated introduction to Korean folklore, with a free Dokkaebi preview PDF.";
  return { title: { absolute: `${title} | Global Folklore Bestiary` }, description,
    alternates: { canonical: route(language), languages: { en: route("en"), ko: route("ko"), "x-default": route("en") } },
    openGraph: { title, description, url: route(language), type: "article", locale: language === "ko" ? "ko_KR" : "en_US", alternateLocale: language === "ko" ? "en_US" : "ko_KR", siteName: "Global Folklore Bestiary", images: [{ url: `${SITE_URL}/guides/korean-folklore/atlas.png`, width: 1024, height: 1536, alt: "Editorial illustration of six figures from Korean folklore" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/guides/korean-folklore/atlas.png`] },
  };
}

export default async function KoreanFolkloreGuide({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (locale !== "en" && locale !== "ko") redirect("/en/guides/korean-folklore");
  const ko = locale === "ko";
  const preview = guide.entries.find((entry): entry is GuideEntry & GuideDetail =>
    (entry.id === "dokkaebi" || entry.id === "kr-dokkaebi") &&
    Array.isArray(entry.sections) && Array.isArray(entry.sourceIds) &&
    typeof entry.variation === "string" && typeof entry.screenLens === "string" &&
    typeof entry.visualNote === "string" && typeof entry.question === "string"
  );
  if (!preview) notFound();
  const sources = guide.sources.filter((source) => preview.sourceIds.includes(source.id));
  const title = ko ? "화면 너머의\n한국 설화" : "Korean folklore.\nBeyond the screen.";
  const downloadLabel = ko ? "무료 영문 미리보기 PDF" : "Download the free preview";

  return <div className={styles.page} lang={locale}>
    <GuideView locale={locale} />
    <a className={styles.skipLink} href="#guide-content">{ko ? "본문으로 이동" : "Skip to content"}</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>GLOBAL FOLKLORE<br /><strong>BESTIARY</strong></Link>
      <nav aria-label={ko ? "주요 메뉴" : "Main navigation"}><Link href={`/${locale}/creatures`}>{ko ? "도감 탐색" : "Explore the bestiary"}</Link><Link href={`/${ko ? "en" : "ko"}/guides/korean-folklore`} hrefLang={ko ? "en" : "ko"} lang={ko ? "en" : "ko"}>{ko ? "English" : "한국어 소개"}</Link></nav>
    </header>

    <main id="guide-content">
      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{ko ? "여섯 존재 · 하나의 입문 가이드" : "Six figures. A place to begin."}</p>
          <h1 id="guide-title">{title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <p className={styles.lede}>{ko ? "드라마에서 만난 이름들이 궁금해졌다면. 도깨비의 장난, 여우의 구슬, 저승으로 가는 길을 따라 한국 설화를 읽습니다." : "A familiar name on screen. A much older story behind it. Follow six figures into a world of bargains, transformations and journeys beyond this life."}</p>
          <p className={styles.languageNote}>{ko ? "가이드 본문과 PDF는 영어입니다. 이 페이지는 한국어 소개와 영문 도깨비 미리보기를 제공합니다." : "An English-language introduction for the folklore-curious. No background knowledge needed."}</p>
          <div className={styles.actions}><GuideDownloadLink locale={locale} className={styles.primary}>{downloadLabel}<span aria-hidden="true">↓</span></GuideDownloadLink><a className={styles.textLink} href="#dokkaebi-preview">{ko ? "웹에서 먼저 읽기" : "Read a little first"}<span aria-hidden="true">↘</span></a></div>
          <p className={styles.small}>{ko ? "도깨비 미리보기와 읽는 방법 · 가입 없이 무료" : "Dokkaebi preview & reading notes · Free, no sign-up"}</p>
          <div className={styles.edition}><span>FIELD NOTES / 01</span><span>{ko ? "전체 가이드 출시 준비 중" : "Full guide in preparation"}</span></div>
        </div>
        <figure className={styles.atlas}>
          <Image src="/guides/korean-folklore/atlas.png" width={1024} height={1536} alt={ko ? "도깨비, 구미호, 저승사자, 불가사리, 해태, 이무기를 그린 여섯 칸의 편집 삽화" : "Six editorial illustrations: Dokkaebi, Gumiho, Jeoseung Saja, Bulgasari, Haetae and Imugi"} sizes="(max-width: 760px) 92vw, 43vw" priority />
          <figcaption><span>PLATE 01 — VI</span>{ko ? "AI의 도움으로 제작한 현대 편집 삽화입니다. 박물관 유물이나 전통 도상의 복제본이 아닙니다." : "Contemporary, AI-assisted editorial art. Not museum artifacts or reproductions of historical images."}</figcaption>
        </figure>
      </section>

      <section className={styles.introduction} aria-labelledby="intro-title">
        <p className={styles.sectionNumber}>01 / {ko ? "이 가이드의 관점" : "A different way of looking"}</p>
        <div><h2 id="intro-title">{ko ? "하나의 이름에도,\n이야기는 여럿입니다." : "There is rarely just\none version."}</h2><div className={styles.introBody} lang="en">{guide.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{ko && <p className={styles.small}>아래 영문 소개는 가이드에 실린 내용입니다. 전승의 지역적 차이와 현대 창작을 구분하며 읽습니다.</p>}</div>
      </section>

      <section className={styles.contents} aria-labelledby="contents-title">
        <div className={styles.sectionHeading}><div><p className={styles.sectionNumber}>02 / {ko ? "여섯 존재" : "The six figures"}</p><h2 id="contents-title">{ko ? "어디서 시작할까요?" : "Who will you meet?"}</h2></div><p>{ko ? "전체 가이드에서 다룰 여섯 존재입니다. 이름을 누르면 기존 도감 항목으로 이동합니다." : "The six subjects of the full guide. Follow a name to its existing bestiary entry."}</p></div>
        <div className={styles.entries}>{guide.entries.map((entry, index) => <article className={styles.entry} key={entry.id} lang="en"><span className={styles.entryNumber}>{String(index + 1).padStart(2, "0")}</span><div><p className={styles.kind}>{entry.kind}</p><h3><Link href={`/${locale}/creatures/${entry.id.startsWith("kr-") ? entry.id : `kr-${entry.id}`}`}>{entry.english}<span aria-hidden="true">↗</span></Link></h3><p className={styles.korean} lang="ko">{entry.korean}</p><p className={styles.tagline}>{entry.tagline}</p><p className={styles.summary}>{entry.summary}</p></div></article>)}</div>
      </section>

      <section id="dokkaebi-preview" className={styles.preview} aria-labelledby="preview-title">
        <aside className={styles.previewAside}><p className={styles.sectionNumber}>03 / {ko ? "무료 미리보기" : "An open chapter"}</p><p className={styles.largeNumber}>01</p><p className={styles.previewKorean} lang="ko">도깨비</p><p>{ko ? "전승을 먼저 읽고, 오늘의 이미지를 다시 봅니다." : "Start with the folklore. Then look at the familiar image again."}</p><GuideDownloadLink locale={locale} className={styles.textLink}>{ko ? "PDF로 읽기" : "Keep the PDF"}<span aria-hidden="true">↓</span></GuideDownloadLink></aside>
        <article className={styles.previewArticle} lang="en"><p className={styles.eyebrow}>DOKKAEBI / FREE PREVIEW</p><h2 id="preview-title">{preview.english}</h2><p className={styles.previewTagline}>{preview.tagline}</p>{preview.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}<section className={styles.marginNote}><h3>Leave room for variation</h3><p>{preview.variation}</p></section><section><h3>When you see one on screen</h3><p>{preview.screenLens}</p></section><section><h3>A note on the illustration</h3><p>{preview.visualNote}</p></section><blockquote className={styles.question}>{preview.question}</blockquote>
          <section id="preview-sources" className={styles.sources}><h3>Follow the sources</h3><p className={styles.small}>The reference articles used for this preview are linked below. Their notes explain the scope of the research.</p><ol>{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true"> ↗</span><span className={styles.srOnly}> (opens in a new tab)</span></a><p>{source.organization}</p><p>{source.note}</p><p className={styles.small}>Accessed {source.accessed}</p></li>)}</ol></section>
        </article>
      </section>

      <section className={styles.fullGuide} aria-labelledby="full-title"><div><p className={styles.sectionNumber}>04 / {ko ? "다음 장" : "The next chapter"}</p><h2 id="full-title">{ko ? "더 깊이 읽는\n여섯 개의 이야기." : "Six figures.\nMore to discover."}</h2><p className={styles.bookTitle} lang="en">{guide.title}</p><p lang="en">{guide.subtitle}</p></div><div><p>{ko ? "전체 영문 가이드는 여섯 존재의 이야기, 전승의 차이, 화면 속 표현을 읽는 관점, 용어 설명과 출처를 함께 담도록 준비하고 있습니다." : "The full English guide brings together all six entries, variations in the traditions, ways to read their screen appearances, a glossary and source notes."}</p><ul className={styles.includes}><li>{ko ? "여섯 존재의 소개와 맥락" : "Six illustrated introductions"}</li><li>{ko ? "전승과 현대 해석을 구분하는 설명" : "Tradition, variation and modern interpretation"}</li><li>{ko ? "다시 찾아볼 수 있는 출처와 용어" : "Sources to follow and terms to keep"}</li></ul><p className={styles.availability}>{ko ? "전체 가이드는 아직 판매하지 않습니다. 가격과 출시일은 확정되지 않았습니다. 현재 받을 수 있는 파일은 무료 미리보기입니다." : "The full guide is not on sale yet. Price and release date are not confirmed. The available download is the free preview."}</p><GuideReleaseLink locale={locale} className={styles.primary}>{ko ? "Threads에서 출시 소식 보기" : "Follow release updates"}<span aria-hidden="true">↗</span></GuideReleaseLink><p className={styles.small}>{ko ? "@mythoriaworldatlas · 새 탭에서 열립니다" : "@mythoriaworldatlas on Threads · Opens in a new tab"}</p></div></section>

      <section className={styles.editorial} aria-labelledby="editorial-title"><p className={styles.sectionNumber}>05 / {ko ? "편집 노트" : "How this was made"}</p><div><h2 id="editorial-title">{ko ? "이야기와 출처 사이에서" : "Curiosity, with a paper trail."}</h2><p lang="en">{guide.editorialNote}</p><p>{ko ? "글과 현대 편집 삽화는 AI의 도움을 받아 제작했습니다. 이 가이드는 어느 박물관의 공식 출판물도 아니며, 삽화는 역사적 모습을 확정하는 자료가 아닙니다." : "Text and contemporary editorial illustrations were developed with AI assistance. This is an independent guide, not an official museum publication; its illustrations do not establish a definitive historical appearance."}</p><GuideShareButton locale={locale} url={route(locale)} className={styles.textLink} /></div></section>
    </main>
    <footer className={styles.footer}><Link href="/">Global Folklore Bestiary</Link><nav aria-label={ko ? "하단 메뉴" : "Footer navigation"}><Link href={`/${locale}/creatures/country/kr`}>{ko ? "한국 도감" : "The Korean bestiary"}</Link><a href="#guide-title">{ko ? "맨 위로" : "Back to top"} ↑</a></nav><span>{ko ? "영문 가이드 · 무료 미리보기" : "An English guide · Free preview"}</span></footer>
  </div>;
}
