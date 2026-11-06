# Brief — Event choice juice and a feed drop slot

Task: player feedback via orchestrator (event juice + drop target) · Lap: temp_job_event-juice-drop · Harness: v0.45.0

## Problem

Choosing an event option feels flat next to a card play (no particles, accent or shake; meter flashes start behind the closing dialog), and the drag drop hint overlays the image feed instead of making room for the post.

## Success check

(a) Mid-drag at 390×844 and 375×667 a placeholder slot sized like the newest post sits at the top of the feed list and pushes the posts down (no bounding-box overlap between slot and posts), document scroll 0; (b) after an event pick the outcome rows count up and flash with the option's accent, and after "Verder" the board meters carry the juice classes (flash, accent) for the option's kind, with the event sound, under the motion setting and mute.

## In scope

- Event option juice = the card juice of its kind (engagement → viral, commercial → ad, journalism → news), via `planJuice`; mapping in game-juice.
- Outcome step: `GameCardEffects` rows pop in staggered, numbers count up from 0 (`CountUpNumber`), per-row flash + accent (`MeterJuice`); reduced motion snaps.
- Board juice for an event step waits until the event dialog has closed (held board view for meters + juice), so it is visible.
- Feed: placeholder slot at the top of the list while dragging (stronger while over), height-animated in/out, snaps away when the post lands; old overlay hint removed.

## Out of scope

- Will NOT touch: engine, event content, pacing (parallel thread), board sounds (event-choice + meter blip stay), screen-reader announcement, focus.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| game-juice | `planJuice` per card type; "event" = flash only | event-kind → action map, `EffectsJuice`, `CountUpNumber.from` | ride |
| kit `GameCardEffects` | static rows | optional per-row `decorate` slot | ride |
| game-flow `EventModal` | Outcome shows static effects | Outcome uses `EffectsJuice` | ride |
| game-board `PlayingBoard`, `PhoneFeed`, `boardView` | juice from newest feed type; overlay drop hint | feed entry carries option kind; held juice view; drop slot | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — four edges, UI only.
Cut into laps: none

## Plan (S)

1. Tests first: `eventJuice` mapping, `CountUpNumber` `from`, `EffectsJuice` (count/flash/accent, reduced), `feedEntryForEvent` option kind, PhoneFeed slot while dragging, PlayingBoard event juice after close.
2. Build game-juice pieces, kit slot, EventModal, PlayingBoard hold, PhoneFeed slot.
3. Gates (type-check, lint, test:run, arch, structure, feature docs); Playwright on the preview at 390×844 / 375×667 with touch.

## Decisions

DECISIONS.md D1–D4.
