# Artlink cross-promotion — 2026-11-23

A single quiet text card appears after creature content and at the end of country lists in all four locales. It follows the existing dark palette, has no image, animation or overlay, and labels the relationship as an advertisement from the operator. Korean readers reach the Korean Artlink landing page; other locales reach the official English page.

Copy was checked against https://art-link.kr/launch and the current App Store listing (6752890224). It describes practice notes and AI feedback without promising free unlimited access or outcomes.

Measurement uses `artlink_promo_view` when at least half of the card is visible and `artlink_promo_click` on the link. Properties: campaign `artlink_20261123`, locale, placement (`creature` / `country`), pathname only. Outgoing links include matching UTM tags. `growth_qa=1` excludes these events and remembers the exclusion for that browser tab after the first measured interaction; this does not exclude ordinary site pageviews. No claim of app installs or paid conversions is possible from outbound clicks alone.

Validation: existing 20-page rendering checks and growth analytics checks; focused runtime checks for the visibility threshold, click metadata, query-data omission, QA exclusion, all locale destinations and navigation with blocked analytics; ESLint; production build and browser review before release. Vercel's deployment build validates the final revision.
