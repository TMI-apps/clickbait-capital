# Brief — Mobile fit and instant drag on /spel

Task: orchestrator request (mobile fit + instant drag) · Lap: temp_job_mobile-fit · Harness: v0.45.0

## Problem

On phones the board sits in an `h-dvh` box that scrolls itself (landscape overflows ~150 px, portrait cards touch the bottom edge and ignore the notch / home indicator), and a touch drag only starts after a 150 ms press-and-hold.

## Success check

At 360×640, 390×844, 414×896, 375×667, 844×390 and 667×375 with touch emulation: `document.scrollingElement` and the board cannot scroll, there is no horizontal overflow, header, meters, feed and all three cards are inside the viewport; a touch drag activates on the first pointer move past 6 px and dropping on the feed plays the card; a tap plays a card; the Details button opens the detail dialog.

## In scope

- Board layout fits the dynamic viewport: grid rows in portrait, two columns (header + meters + feed | draft) in landscape and ≥ lg; the feed absorbs short heights; safe-area insets (`viewport-fit=cover`).
- No document scroll / rubber-band / pull-to-refresh while the board is shown (`overscroll-behavior`, `overflow: hidden` on the root scroller); no double-tap zoom on the board (`touch-action`).
- Drag: one `PointerSensor` with a distance constraint replaces the Mouse + delayed Touch sensors; cards `touch-action: none`.
- Kit `Modal` scrolls internally when taller than the viewport (event dialog on a landscape phone).
- PWA `display` decision recorded.

## Out of scope

- Will NOT touch: card texts, glossary, images (parallel laps), game rules, keyboard play path, screen-reader texts, reduced-motion behaviour.
- Will NOT block pinch zoom (`user-scalable=no` / `maximum-scale`): accessibility (WCAG 1.4.4), and iOS ignores it.

## Edges

| Feature area | Loop today                                                                                   | Hook point                                       | Ride / new |
| ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------- |
| game-board   | `PlayingBoard` flex column `h-dvh overflow-y-auto`; dnd-kit Mouse + Touch(delay 150) sensors | `PlayingBoard`, `CardDraft`, `PhoneFeed`         | ride       |
| kit `Modal`  | fixed, centred, no max height                                                                | `Modal` content classes                          | ride       |
| app shell    | `index.html` viewport meta, `src/index.css` base                                             | viewport-fit, custom variant, viewport-lock rule | ride       |

## Size

S — three edges, no new dependency, no data change.
Cut into laps: none

## Decisions

DECISIONS.md D1–D6.

## Plan (size S)

1. Acceptance: Playwright script with touch emulation (`hasTouch`, `isMobile`, CDP `Input.dispatchTouchEvent`) on the six viewports — fit (no document / board scroll, no horizontal overflow, header, meters, feed, heading, three cards inside the viewport), drag active after one 10px move, drop on feed plays, tap plays, 3px jitter still plays, Details opens without playing, dialog inside viewport. Red on main (drag after one move: FAIL; landscape board scrolls 145–160px).
2. `PlayingBoard`: grid + `board-split`, safe-area padding, `data-viewport-lock`, `touch-manipulation`; `PointerSensor` distance 6.
3. `CardDraft`: `touch-none`, `board-split` width; `PhoneFeed`: `overscroll-contain`. (A height-based card cap was built, measured as never engaging, and removed — D3.)
4. `src/index.css`: `board-split` variant, viewport lock, body side insets; `index.html`: `viewport-fit=cover`.
5. Kit `Modal`: max height + internal scroll.
6. README (game-board D3, fit), decision log.

Reuse checked: dnd-kit sensors already in the project (no new dependency); no existing safe-area or scroll-lock helper in `src/`.

## Check summary

- Playwright (touch emulation): 360×640, 390×844, 414×896, 375×667, 844×390, 667×375 — all fit checks and all input checks pass; also 375×553 (portrait with browser bars), 1280×800 and 1024×1366 fit. Event dialog on 667×375 scrolls inside itself (content 505px in 341px), last button reachable.
- `pnpm type-check`, `lint` (0 errors, same 20 warnings as main), `arch:check`, `validate:structure`, `validate:feature-docs`, `test:run` (483 passed), `test:classify`, `build`, `validate:bundle-size` (137.4 KiB / 150 KiB).
- Not verified: real iOS / Android devices (notch insets, pull-to-refresh, rubber-band, installed PWA) — emulation only; keyboard play and screen-reader paths unchanged in code and covered by the existing `GameBoard.test.tsx`, not re-tested by hand.
- Known limits: portrait below ~500px tall clips the draft bottom (D3); on 667×375 (iPhone SE sideways) cards are ~90px wide and the type chip sits under the info button.
