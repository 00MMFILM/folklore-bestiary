# Bulgasari encounter sample

The three existing Bulgasari detail URLs link to an English, system-neutral
encounter at `/en/encounters/bulgasari`. The full text and six-page PDF are free.
The proposed ten-encounter collection is marked as unreleased; there is no checkout.

Compact sample cards also appear on the home page and the Korea country listing.
Their copy follows the selected Korean, English, Japanese or Chinese interface
language. The linked encounter and PDF are in English.

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
| `encounter_promo_view` | At least 50% of a sample card remained in the viewport for one continuous second while the tab was visible | `sample_id`, `placement` |
| `encounter_promo_click` | A sample card's link was clicked | `sample_id`, `placement` |

The sample ID is `bulgasari-01`. PDF placements are `sample` and `sample_footer`.
Card placements are `home_ko`, `home_en`, `home_ja`, `home_zh`, `korea_ko`,
`korea_en`, `korea_ja` and `korea_zh`. The suffix describes the card's interface
language, not the language of the English sample. Resolving the home's saved or
browser locale cancels any pending timer for the initial language.

Detail and sample view events describe a page mounting, not viewport visibility.
Repeat effects within the same mounted component are suppressed. A promo view
instead requires the visibility condition above and fires at most once per
placement during that card's mount. Scrolling below the 50% threshold or hiding
the tab cancels the pending timer; returning starts a new full second. If
`IntersectionObserver` is unavailable, promo views are not recorded, but the
card and link remain usable. Reloads and remounts can count a new view, and
repeated clicks count again. Promo clicks are separate from detail-page sample
clicks. Events contain no user input, identifiers, email addresses or threat-track
state.

Promo events measure rendered banner exposure and link activation. They do not
establish that someone read the card, was interested, intended to buy or purchased.
Intersection does not detect occlusion by another page element. A click before
the first full second can be recorded without a promo view, so dividing the two
totals is not an exact same-user conversion rate.

A PDF click is not a completed save, a read, a playtest or a purchase. Pageview
totals and click totals do not establish a same-user conversion funnel. Browser
blocking can undercount both. Check real event delivery in the production
dashboard before using these numbers to evaluate demand.

## Validation and release

```sh
node scripts/apply-bulgasari-review.mjs --dry
node scripts/test-bulgasari-review.mjs
node scripts/test-encounter-render.cjs
node scripts/test-encounter-analytics.cjs
node scripts/test-encounter-promo.cjs
npx tsc --noEmit
npm run build
```

The analytics and promo tests use the installed SDK with controlled browser
hooks, observer entries and timers. They cover the one-second visibility
threshold, timer cancellation, placement deduplication, locale changes, missing
observer and blocked analytics without breaking native links. They do not
establish actual browser visibility or event delivery; verify those after deploy.

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
check desktop and mobile views in all four card languages, follow home or Korea
listing → sample → PDF as well as detail → sample → PDF, and confirm the events
in Vercel Analytics. No paid generation API is used by this feature.
