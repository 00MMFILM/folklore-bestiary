# Bulgasari encounter sample

The three existing Bulgasari detail URLs link to an English, system-neutral
encounter at `/en/encounters/bulgasari`. The full text and six-page PDF are free.
The proposed ten-encounter collection is marked as unreleased; there is no checkout.

## Content

- `content/encounters/bulgasari.json` is the sample text. Folklore notes cite two
  Academy of Korean Studies encyclopedia entries; adventure rules are original.
- `public/samples/bulgasari-free-sample.pdf` is the reviewed 11 October preview.
  It has the same text as the pilot PDF, including research and playtest limits.
- `content/reviews/bulgasari-20261014.json` contains the corrections for
  `kr-bulgasari`, `kr-balgasari`, and `kr-bulgasari-creature`.
- The review driver updates the canonical entries, three translation files and
  three articles. IDs, ratings, classifications, unrelated entries and images
  are preserved. English detail tags use the reviewed English copy directly.
- Existing article attribution keeps its old behavior unless an article supplies
  explicit `sources` and localized `researchNotes`.

The threat track and the OVERSIZED checkbox are independent. They are transient
session aids, reset on reload, and never sent to analytics.

## Measurements

Existing Vercel pageviews measure detail and sample visits. Custom events use at
most two properties, require Web Analytics to be enabled and a supporting plan
(Pro or Enterprise), and never block native links.

| Event | Meaning | Properties |
|---|---|---|
| `encounter_detail_view` | A reviewed detail page mounted | `sample_id`, `locale` |
| `encounter_sample_view` | The English sample page mounted | `sample_id`, `locale` |
| `encounter_sample_click` | Its link was clicked on a detail page | `sample_id`, `locale` |
| `encounter_pdf_click` | A PDF link was clicked | `sample_id`, `placement` |

The sample ID is `bulgasari-01`. Placement is `sample` or `sample_footer`.
Views are suppressed only for repeat effects within the same mounted component.
Reloads, revisits and repeated clicks count again. Events contain no user input,
identifiers, email addresses or threat-track state.

A PDF click is not a completed save, a read, a playtest or a purchase. Pageview
totals and click totals do not establish a same-user conversion funnel. Browser
blocking can undercount both. Check real event delivery in the production
dashboard before using these numbers to evaluate demand.

## Validation and release

```sh
node scripts/apply-bulgasari-review.mjs --dry
node scripts/test-bulgasari-review.mjs
node scripts/test-encounter-render.cjs
npx tsc --noEmit
npm run build
```

The render contract test checks published paragraphs, anchors, PDF availability,
locale redirects, twelve detail variants, English tags and a download with
analytics disabled. It uses React server rendering, not a browser or the Vercel
collection endpoint. It does not verify responsive appearance or hydration.

For a newer upstream snapshot, apply the application-code patch first, then run
the review driver with `--dry` and `--apply`. Do not replace the current giant
canonical line or translation files with an older complete copy. The driver
targets the three IDs and records old/new values in its JSONL runlog. Re-running
it after a successful application is a no-op.

Before release, use matching native dependencies for the build machine, build,
check desktop and mobile views, follow detail → sample → PDF, and confirm the
events in Vercel Analytics. No paid generation API is used by this feature.
