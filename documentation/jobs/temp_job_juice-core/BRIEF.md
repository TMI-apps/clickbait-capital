# Brief — Game juice system (lap 1 of 4: juice core)

Task: Full game juice system (orchestrator backlog; owner request recorded in the thread prompt) · Lap: temp_job_juice-core · Harness: v0.45.0

## Problem

Juice today is a set of one-off paths (board `useActionJuice` + `planJuice`, `EffectsJuice`, `EndJuice`, feed entrance classes, board sound ids in `boardSounds.ts`), so adding or tuning feedback means editing gameplay components, and most moments (drag, hold, forecast, comments, goals, scandal, phase, share, buttons) have none.

## Whole job (4 laps, each ≤ M, one PR each, each off the latest main)

1. **juice-core (this lap):** event-driven engine, effect primitives, game juice catalog with recipes for the moments that already have juice, the dev inspector at `/juice`. No gameplay rewiring yet.
2. **juice-migrate:** the board, event outcome, feed entrance, end screens and all board sounds emit catalog events instead of calling effects; delete `planJuice`, `useActionJuice`, `JuiceLayer`, `MeterJuice`, `EndJuice`, `FEED_ENTRANCE`, `boardSounds`/`useBoardSounds` and the `withTap` sound path. One path left.
3. **juice-wiring-board:** pick-up / drag / over-feed / drop / cancel, hold and forecast, card landing in the feed, comments arriving, meter changes with floaters, goal crossings, money danger, scandal warning ramp and scandal hit.
4. **juice-wiring-flow:** phase intros and transitions, event dialog appear / choice / outcome, bankruptcy and IPO endings, results and sharing, buttons and navigation, onboarding (how-to-play) moments, the player settings the owner picks (haptics / intensity), and the agent pointer (rule line, protected — asked).

## Success check (this lap)

On `/juice`, triggering any catalog event runs its recipe's effect steps through the director with the current tuning (intensity, motion scale, volume, haptics) — e.g. `card.played` viral shakes the stage, throws 12 emoji and plays `card-viral` — while reduced motion leaves only the non-motion steps (sound, static marks) and never more than 3 screen flashes per second; editing a step value in the inspector changes the next run and survives a reload.

## In scope

- `juice-engine` feature (generic, no game words): typed event bus (`emit`), recipe and step types, director (variant pick, step scheduling, channel gates, intensity / motion scale / volume, flash-rate guard, concurrency budget, cancel), anchor registry (`useJuiceAnchor`), tuning store (defaults + persisted overrides), `JuiceStage` overlay host.
- `juice-effects` feature: primitives — sound (port), haptic, shake, pop/squash, pulse, zoom, flash, glow, tint, particles (emoji / coins / confetti / sparkles), floater (number / text), callout, badge, time warp (hit-stop / slow-mo). WAAPI on transform/opacity, pooled stage nodes, all self-cleaning. `particlePaths` and `motionTokens` move here from game-juice.
- `game-juice`: the game event catalog (typed payloads) and the recipe table as content-as-data for the moments that have juice today; `GameJuiceRoot` (lazy, mounted once in `App.tsx`) wiring the director to game-audio (sound port), the Beweging setting (motion gate) and the stage.
- `juice-inspector` feature + `/juice` page: trigger every event (with variants) on a mock stage (meters, chart, card, feed, button anchors), global tuning sliders, per-step value editor, event log, copy-overrides-as-JSON, reset.
- Unit tests for bus, director, tuning, primitives, recipes; README per new feature; decision log rows.

## Out of scope

- Will NOT do (this lap): rewiring gameplay to emit events (laps 2–4); new sound files; player-facing haptics / intensity settings (owner question, lap 4); a rule or skill pointer (protected, lap 4).
- Will NOT touch: the game's current juice behaviour (old path stays live until lap 2 deletes it; the board looks and sounds the same after this lap), game rules, the score chart internals, Supabase.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `juice-engine` | Not found | new feature | new — generic runtime, game-agnostic |
| `juice-effects` | particles/shake/count-up live inside game-juice | new feature; `particlePaths`, `motionTokens` move in | new — primitive library |
| `game-juice` | `planJuice` → `useActionJuice` → `JuiceLayer`/`MeterJuice` | add catalog types, recipes, `GameJuiceRoot`; re-export moved helpers | ride |
| `juice-inspector` + `src/pages/JuiceInspectorPage.tsx` | Not found | `/juice` lazy route in `src/App.tsx` | new — dev tool |
| `game-audio` | `useSoundEffects().play(id)` | `play(id, { volume, rate })` option for recipe tuning | ride — additive |
| `game-settings` | `useReducedMotion()` | read only (motion gate) | ride — no change |
| `src/App.tsx` | routes | lazy `GameJuiceRoot` + `/juice` route | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — four feature areas (two new generic features, one new dev feature, one ride) plus moving two helpers; no gameplay rewiring.
Cut into laps: juice-migrate, juice-wiring-board, juice-wiring-flow (listed above; the orchestrator owns the backlog rows).

## Decisions

`DECISIONS.md` D1–D9.
