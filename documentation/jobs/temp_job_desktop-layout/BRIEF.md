# Brief — Desktop board: play column and status panel

Task: owner request via orchestrator "On desktop I'd rather have the cards with the feed on one side and all stats stacked vertically on the other side." · Lap: temp_job_desktop-layout · Size: S

## Problem

On wide screens the board used the sideways-phone split (mobile-fit D2): phase header, the three meter tiles in a row and the feed on the left, the hand floating mid-height on the right in a mostly empty column. The hand was far from the feed (long drag, eye travel) and the stats sat above the feed instead of in a glanceable panel.

## Success check

At 1440×900, 1280×720 and 1024×768: feed with the hand directly under it in a play column, the hand fully visible, no document scroll; a status panel on the right with phase, goal, progress, turn, the three meters stacked as larger tiles, the active modifier notice and the sound / pause controls. A drag from hand to feed plays the card, an event dialog shows, no console errors. 390×844, 360×640 and 844×390 render exactly as before.

## In scope

- New `board-desk` variant (`src/index.css`); `board-split` narrowed to sideways phones.
- `PlayingBoard` grid: status and play wrappers (`display: contents` off desk); `MeterPanel` stacked larger tiles on desk; `DroughtNotice` extracted from `CardDraft`, shown in the panel on desk.
- game-board README, decision log.

## Out of scope

Phone and small-tablet layouts, the event dialog, feed internals, new copy.

## Plan

1. Variant + grid + wrappers + panel notice (gate: Playwright metrics at the six sizes, mobile rects equal to the baseline).
2. Lint / type-check / tests / arch; README + decision log.

## Progress

- Phase 1: Done. Phase 2: Done.
- Change round (Stop 2): status panel scrolled sideways (D5). Done; feed posts unchanged (approved at 58ffedf).
