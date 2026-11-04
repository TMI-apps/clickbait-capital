# Brief — Game feel: asymmetric juice and animations (+ Show wasted gains at the meter cap)

Task: "Game feel: asymmetric juice and animations" (M) + "Show wasted gains at the meter cap" (S) · Lap: temp_job_game-juice · Harness: v0.44.0

## Problem

Playing a card feels the same for every type, so the design's core manipulation (DOC_GAME_DESIGN § 5: dopamine rewarded loudly, ethics presented dull) is missing, and gains past a full meter (100) are silently wasted, so players never learn to adapt.

## Success check

Playing a viral card shakes the board and throws emoji over the screen with flames at Gebruikers, an ad card flies coins to Inkomsten with a count-up and gold glow, a news card slides dry into the feed with only a small shield at Reputatie; with prefers-reduced-motion none of the motion or particles render but the state change (accents, numbers, deltas) still shows; a card whose gain would push a meter past 100 shows the applied part plus a "MAX" mark, and a full meter shows a cap glow with a "MAX" label.

## In scope

- New feature `src/features/game-juice/`: pure juice plan per action (type → shake, particles, meter accents, meter flash), particle trajectories (capped counts), motion-preference hook, particle overlay, meter accent, count-up number, end-screen entrance burst.
- Card draw stagger, type-specific feed entrance (news dry slide), meter count-up/down + gain/loss flash, win/loss entrance.
- Motion tokens for juice durations (base + reduced).
- Wasted gains: board view caps a card's positive effect at the meter's room; `GameCardEffect.overflow` renders a "MAX" mark; full meter gets a cap glow + "MAX" label.

## Out of scope

- Will NOT do: settings toggle for motion (game-settings lap backs `useMotionPreference` later); previewing turn modifiers (Ad-Fatigue, Echo-Chamber) on cards — excluded (game-board D10).
- Will NOT touch: engine rules, game-content copy, game-flow screens' structure, sound selection/timing (visuals start on the same action render as the sounds).

## Edges

| Feature area | Loop today                                                                       | Hook point                                                                                                                                                                                                   | Ride / new                                 |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| game-juice   | Not found                                                                        | new feature                                                                                                                                                                                                  | new — one bounded concept: action feedback |
| game-board   | play → `useGameSession` → `BoardView` → `PlayingBoard` renders meters/feed/draft | `PlayingBoard` (overlay, shake ref, card origin), `MeterPanel` (count-up, accent, cap), `PhoneFeed` (entrance), `CardDraft` (stagger, data attr), `GameBoard` (end entrance), `boardView.toDraft` (overflow) | ride                                       |
| GameCard kit | `GameCardEffects` renders signed delta                                           | optional `overflow` on `GameCardEffect`                                                                                                                                                                      | ride                                       |
| theme tokens | `duration-card-*`, reduced overrides                                             | new `duration-juice-*` tokens                                                                                                                                                                                | ride                                       |
| index.css    | `@theme` keyframes card-draw/play                                                | juice keyframes + animate utilities                                                                                                                                                                          | ride                                       |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — new feature (~8 files) + 5 board integration points + kit prop + tokens.
Cut into laps: none.

## Decisions

DECISIONS.md D1…D8.
