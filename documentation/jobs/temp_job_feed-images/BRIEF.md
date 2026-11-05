# Brief — Feed posts with the card's image

Task: owner request via orchestrator ("I don't see the images on the feed") · Lap: temp_job_feed-images · Harness: v0.45.0

## Problem

Hand cards show thumbnail-style photos, but a card played into "Je feed" becomes a text-only post (type label, title, body). The feed does not look like a social-media feed, and the clickbait thumbnail the player just chose disappears the moment it is posted.

## Success check

After playing a card (drag or details → "In de feed"), the newest feed post shows that card's photo in the same artwork treatment as the hand card (ThumbnailFrame on viral / ad / event, plain on news, type-icon placeholder when the id has no photo) with its title and body, on top and fully visible without scrolling at 390×844 and 375×667; older posts are compact rows (small photo + type + title); `/spel` document scroll stays 0.

## In scope

- `FeedEntry.contentId` (card or event id) set by `feedEntryForCard` / `feedEntryForEvent`.
- `PhoneFeed`: newest post = image + type label + title + body; older posts = compact row (64 px photo, type label, title; body kept for screen readers). Images via `getCardImage(contentId)` from card-imagery and the GameCard kit's artwork (`GameCardArtwork`, now exported) — no second image path.
- Newest post layout follows the feed box: photo beside the text when the feed is short (375×667, landscape split), photo on top of the text when the feed box is tall enough (390×844).
- Drag hint ("Laat los om te plaatsen") overlays the feed instead of pushing the posts down; the feed list scrolls back to the top when a post arrives.

## Out of scope

- Will NOT do: new images or manifest changes, a new image component, feed animations beyond the existing `FEED_ENTRANCE`.
- Will NOT touch: screen-reader announcements (`describeTurn`), focus behaviour, board grid (mobile-fit D2), `app-tasks*.json`.

## Edges

| Feature area               | Loop today                                     | Hook point                                     | Ride / new                                                                        |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| game-board                 | `toFeed` → `FeedEntry` → `PhoneFeed` text post | `FeedEntry.contentId`, `PhoneFeed` post layout | ride                                                                              |
| components/common/GameCard | `GameCardArtwork` internal to `GameCard`       | export `GameCardArtwork` from the kit barrel   | ride — same image path (lazy, focal point, fallback, ThumbnailFrame / news plain) |
| card-imagery               | `getCardImage(id)` for draft + detail          | also the feed                                  | ride                                                                              |
| docs                       | game-board README, DOC_DECISION_LOG.md         | § feed-images                                  | ride                                                                              |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one component layout, one view-model field, one kit export.
Cut into laps: none

## Decisions

DECISIONS.md D1…D5

## Plan

Acceptance test (fails before the build): `GameBoard.test.tsx › should show the played card's photo in the newest feed post when a card is played` — plays a card with a manifest photo, expects an `img` with the manifest alt inside the feed's first list item, and `boardView.test.ts` expects `contentId` on feed entries.

1. **View model** — `FeedEntry.contentId`; `feedEntryForCard` = `card.id`, `feedEntryForEvent` = `event.id`. Gate: `boardView.test.ts`.
2. **Kit export** — `GameCardArtwork` + props exported from `src/components/common/GameCard/index.ts`. Gate: type-check.
3. **PhoneFeed** — `FeedPost` (newest: container-query layout, image + text) and `FeedRow` (compact) in `PhoneFeed.tsx` (game-board is at its 25-file budget: no new files); compact rows pass the image without its caption / sticker / marker (unreadable at 64 px; boost + glow stay); drag hint absolutely positioned; list scroll reset on new post. Gate: acceptance test, `GameBoard.test.tsx`, lint.
4. **Docs** — game-board README § Decisions + Testing; DOC_DECISION_LOG.md § feed-images. Gate: `pnpm validate:feature-docs`.
5. **Browser check** — Playwright 390×844 and 375×667 with touch: 1, 3 and 8 cards (drag + details), screenshots, document scroll 0, no console errors; bundle budget.

Pattern & precedent: social feeds (Instagram, TikTok inbox, X) show the newest post large with media first and older items as compact rows/cards; media boxes reserve their aspect ratio before load (no CLS) and load lazily. The plan follows that.
Conflict & compliance: no new dependency; reuse checked — `GameCardArtwork` (kit), `ThumbnailFrame` (kit), `getCardImage` (card-imagery); budget kept by staying inside `PhoneFeed.tsx`.
