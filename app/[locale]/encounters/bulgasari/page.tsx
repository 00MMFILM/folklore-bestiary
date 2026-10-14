import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncounterDownloadLink, EncounterView } from "@/components/EncounterAnalytics";
import sample from "@/content/encounters/bulgasari.json";
import { isValidLocale } from "@/lib/i18n";
import ThreatTrack from "./ThreatTrack";
import styles from "./sample.module.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app";
const canonical = `${siteUrl}/en/encounters/bulgasari`;

export const metadata: Metadata = {
  title: { absolute: `${sample.title} — Free Bulgasari Encounter | ${sample.brand}` },
  description: sample.description,
  alternates: { canonical, languages: { en: canonical } },
  openGraph: {
    title: `${sample.title} — A free Bulgasari encounter`,
    description: sample.pitch,
    url: canonical,
    type: "article",
    locale: "en_US",
    siteName: sample.brand,
    images: [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630, alt: sample.brand }],
  },
  twitter: { card: "summary_large_image", title: sample.title, description: sample.pitch },
};

export default async function BulgasariEncounter({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (locale !== "en") redirect("/en/encounters/bulgasari");

  return (
    <div className={styles.page} lang="en">
      <EncounterView stage="sample" locale="en" />
      <a href="#encounter" className={styles.skipLink}>Skip to the encounter</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>{sample.brand}</Link>
        <nav aria-label="Site navigation"><Link href="/">Home</Link><Link href="/en/creatures">Bestiary</Link></nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="sample-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{sample.edition}</p>
            <p className={styles.creature}>{sample.creature} <span lang="ko">{sample.korean_name}</span><span className={styles.country}>Korean folklore</span></p>
            <h1 id="sample-title">{sample.title}</h1>
            <p className={styles.pitch}>{sample.pitch}</p>
            <p className={styles.description}>{sample.description}</p>
            <div className={styles.actions}><EncounterDownloadLink className={styles.primaryLink}>Download the free PDF · 6 pages</EncounterDownloadLink><a href="#encounter" className={styles.textLink}>Read the full encounter ↓</a></div>
            <p className={styles.previewNote}>Free to read and download. Editorial preview · Not yet playtested.</p>
          </div>
          <div className={styles.heroAside}>
            <div className={styles.emblem} aria-hidden="true"><span>Fe</span><span>26 / IRON</span></div>
            <p className={styles.asideTitle}>A meal.<br />A mistake.<br />A village in debt.</p>
            <dl className={styles.facts}><div><dt>Format</dt><dd>System-neutral encounter</dd></div><div><dt>At the table</dt><dd>3 characters · 3 locations</dd></div><div><dt>Includes</dt><dd>Sources &amp; an interactive threat track</dd></div></dl>
          </div>
        </section>

        <div className={styles.reader}>
          <aside className={styles.sidebar}>
            <nav aria-label="On this page" className={styles.contents}><p className={styles.eyebrow}>In this encounter</p><a href="#folklore">01 · The folklore</a><a href="#encounter">02 · Run the encounter</a><a href="#people">03 · People &amp; places</a><a href="#threats">04 · Threats &amp; growth</a><a href="#resolutions">05 · Two ways forward</a><a href="#table-sheet">06 · Table reference</a><a href="#sources">07 · Sources &amp; credits</a></nav>
            <ThreatTrack steps={sample.clock} />
          </aside>

          <article className={styles.article}>
            <section id="folklore" className={styles.section}>
              <p className={styles.eyebrow}>01 / Reference notes</p><h2>The folklore, before the fiction.</h2>
              <p className={styles.intro}>Four notes from Korean scholarly reference articles. Sources are linked below; they do not establish a single definitive version.</p>
              <div className={styles.notesGrid}>{sample.folklore.map((note) => <div className={styles.note} key={note.title}><h3>{note.title}</h3><p>{note.body}</p><div className={styles.sourceTags}>{note.sources.map((id) => <a href={`#source-${id}`} key={id} aria-label={`Read source ${id}`}>{id}</a>)}</div></div>)}</div>
              <div className={styles.boundary}><p className={styles.eyebrow}>Where the evidence ends</p><p>{sample.boundary}</p></div>
            </section>

            <section id="encounter" className={styles.section}>
              <p className={styles.eyebrow}>02 / Original game material</p><h2>Run the encounter.</h2><p className={styles.intro}>{sample.format_note}</p>
              <dl className={styles.quickstart}>{sample.quickstart.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl>
              <h3 className={styles.subheading}>Read aloud</h3><blockquote className={styles.opening}>{sample.opening}</blockquote>
              <h3 className={styles.subheading}>What really happened</h3><p>{sample.truth}</p>
              <h3 className={styles.subheading}>The creature rules for this adventure</h3><div className={styles.stack}>{sample.game_rules.map((rule) => <div key={rule.title} className={styles.rule}><h4>{rule.title}</h4><p>{rule.body}</p></div>)}</div>
            </section>

            <section id="people" className={styles.section}>
              <p className={styles.eyebrow}>03 / People &amp; places</p><h2>Everyone has something to lose.</h2>
              <div className={styles.stack}>{sample.npcs.map((npc) => <div className={styles.person} key={npc.name}><div className={styles.cardHeading}><h3>{npc.name}</h3><span>{npc.role}</span></div><dl className={styles.detailList}><div><dt>Wants</dt><dd>{npc.want}</dd></div><div><dt>Offers</dt><dd>{npc.offer}</dd></div><div><dt>Under pressure</dt><dd>{npc.pressure}</dd></div></dl></div>)}</div>
              <h3 className={styles.subheading}>Three connected locations</h3><p className={styles.mapNote}>{sample.map_note}</p>
              <div className={styles.stack}>{sample.locations.map((location) => <section className={styles.location} key={location.number}><div className={styles.locationTitle}><span aria-hidden="true">{location.number}</span><h4>{location.name}</h4></div><p>{location.detail}</p><dl className={styles.detailList}><div><dt>Clue</dt><dd>{location.clue}</dd></div><div><dt>Action</dt><dd>{location.action}</dd></div></dl></section>)}</div>
              <div className={styles.callout}><h3>Keep the clues available</h3><p>{sample.clue_policy}</p></div>
            </section>

            <section id="threats" className={styles.section}>
              <p className={styles.eyebrow}>04 / Pressure, with room to intervene</p><h2>Threats are not growth.</h2><p className={styles.intro}>{sample.clock_rule}</p>
              <ol className={styles.threatList}>{sample.clock.map((step) => <li key={step.name}><h3>{step.name}</h3><p>{step.body}</p></li>)}</ol>
              <p className={styles.small}>Use the tracker beside this article (above it on narrow screens) to record the current threat and actual growth separately.</p>
            </section>

            <section id="resolutions" className={styles.section}>
              <p className={styles.eyebrow}>05 / Two ways forward</p><h2>Neither answer is free.</h2><div className={styles.stack}>{sample.resolutions.map((resolution) => <div key={resolution.title} className={styles.resolution}><h3>{resolution.title}</h3><dl className={styles.detailList}><div><dt>The method</dt><dd>{resolution.method}</dd></div><div><dt>The cost</dt><dd>{resolution.cost}</dd></div><div><dt>If it fails</dt><dd>{resolution.failure}</dd></div></dl></div>)}</div>
              <div className={styles.callout}><h3>When the players invent another way</h3><p>{sample.improvisation}</p></div>
              <h3 className={styles.subheading}>What follows them home</h3><div className={styles.stack}>{sample.aftermath.map((hook) => <div key={hook.title} className={styles.rule}><h4>{hook.title}</h4><p>{hook.body}</p></div>)}</div>
            </section>

            <section id="table-sheet" className={styles.section}>
              <p className={styles.eyebrow}>06 / Keep within reach</p><h2>The table reference.</h2><ul className={styles.checklist}>{sample.table_sheet.map((item) => <li key={item}>{item}</li>)}</ul>
              <EncounterDownloadLink className={styles.primaryLink}>Download the free PDF · 6 pages</EncounterDownloadLink>
              <h3 className={styles.subheading}>Questions for a first reader</h3><p>Use these prompts to evaluate the preview before bringing it to your group.</p><ol className={styles.questions}>{sample.questions.map((question) => <li key={question}>{question}</li>)}</ol>
            </section>

            <section id="sources" className={styles.section}>
              <p className={styles.eyebrow}>07 / Research &amp; credits</p><h2>Follow the sources.</h2>
              <div className={styles.stack}>{sample.sources.map((source) => <section id={`source-${source.id}`} key={source.id} className={styles.source}><p className={styles.eyebrow}>{source.id} / Scholarly reference article</p><h3><a href={source.url} target="_blank" rel="noreferrer">{source.title} <span className={styles.externalLabel}>(opens in a new tab)</span></a></h3><p>{source.institution}</p><p className={styles.small}>Author: <span lang="ko">{source.author}</span> · Last updated: <time dateTime={source.updated}>{source.updated}</time></p><p><strong>Used for:</strong> {source.used_for}</p></section>)}</div>
              <div className={styles.researchNotes}><h3>What has been checked</h3><p>{sample.research_note}</p><h3>How this preview was made</h3><p>{sample.credits_note}</p><p className={styles.small}>Preview dated <time dateTime={sample.date}>11 October 2026</time>.</p></div>
              <Link href="/en/creatures/kr-bulgasari" className={styles.textLink}>Read Bulgasari in the bestiary →</Link>
            </section>
          </article>
        </div>

        <section className={styles.collection} aria-labelledby="collection-title"><p className={styles.eyebrow}>A collection in development</p><h2 id="collection-title">{sample.collection_title}</h2><p>This free encounter is a preview of a planned collection of ten encounters. The full collection has not been released. Scope and price are still being validated; it is not available to purchase.</p><EncounterDownloadLink className={styles.primaryLink} placement="sample_footer">Download the free PDF · 6 pages</EncounterDownloadLink></section>
      </main>
      <footer className={styles.footer}><span>{sample.brand} · Editorial preview</span><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/en/creatures">Back to the bestiary</Link><a href="#sample-title">Back to top ↑</a></nav></footer>
    </div>
  );
}
