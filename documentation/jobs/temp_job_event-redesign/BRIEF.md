# Brief — Event dialog redesign: hidden effects, outcome reveal, one-screen fit

Task: owner request via orchestrator (event redesign) · Lap: temp_job_event-redesign · Harness: v0.45.0

## Problem

The event dialog gives away each option's effect (kind label, meter icons, ± numbers) and needs scrolling on small phones, so the choice is no dilemma and the dialog feels heavy.

## Success check

At 375×667, 390×844 and 360×640 (dark and light) an event shows photo, title, body and three compact options with no effect numbers, meter icons or kind labels, without any scroll (dialog height ≤ viewport, dialog `scrollHeight == clientHeight`, document scroll 0); choosing one shows an outcome step (chosen action + its meter changes, "Verder" focused) and "Verder" applies the choice.

## In scope

- `EventModal`: options show only a neutral letter (A/B/C by position) + action label; after a tap an in-dialog outcome step (chosen label + `GameCardEffects`, "Verder" button, autofocus, described by the outcome); `onChoose` fires on "Verder".
- Compact layout: smaller photo banner, tighter dialog padding/gaps, redesigned `choice` kit variant (row: letter badge + label, ≥ 44 px).
- Copy: `UI_COPY.events` outcome kicker + continue button; drop unused `optionKinds`.
- Tests: no effects/labels in options; outcome after choosing; focus; Playwright fit check at three sizes, both themes.

## Out of scope

- Will NOT touch: engine, balance, event content, board juice / screen-reader announcement (they already run after the dialog closes).
- Option order: shuffled per run + event in the board view layer (added after D5 was decided by the owner).

## Edges

| Feature area                   | Loop today                                              | Hook point                                 | Ride / new                          |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------ | ----------------------------------- |
| game-flow `EventModal`         | event → options with effects → `onChoose`               | options + new outcome step                 | ride                                |
| kit `Button` `choice`, `Modal` | only consumer is EventModal                             | variant classes; Modal `className`         | ride                                |
| game-content `UI_COPY.events`  | kicker, prompt, optionKinds                             | outcome copy                               | ride                                |
| game-board `PlayingBoard`      | `chooseOption` on tap; juice + announcement after close | unchanged (gets the choice after "Verder") | ride                                |
| game-board `boardView`         | `toEventView` maps options in engine order              | option order via `seededOrder` (D5)        | ride — view layer, engine unchanged |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one component, one kit variant, copy, tests.
Cut into laps: none

## Plan (S)

1. Failing tests in `EventModal.test.tsx` (no "Geld"/numbers/meter text in options; outcome shown after a tap with effects, `onChoose` only after "Verder", "Verder" focused).
2. Copy, kit `choice` row layout, EventModal options + outcome step, compact Modal padding + banner.
3. Gates: type-check, lint, tests (incl. balance simulation), arch, structure; Playwright fit + screenshots on the preview.

## Decisions

DECISIONS.md D1–D5 (D5 decided by the owner via the orchestrator).
