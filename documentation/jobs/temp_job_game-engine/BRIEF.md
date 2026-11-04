# Brief — Game rules engine and content schema

Task: Game rules engine and content schema · Lap: temp_job_game-engine · Harness: v0.44.0

## Problem
The game has a design (`documentation/DOC_GAME_DESIGN.md`) but no rules code, so a game-board lap has nothing to drive the cards and meters.

## Success check
From a fixed seed and the seed content, `createGame` → repeated `playCard` / `resolveEvent` produces an identical game every run, and scripted runs reach each of the three game overs and the IPO win per the design rules.

## In scope
- Pure TypeScript services in `src/features/game-engine/` (no UI, no hooks): game state, three meters 0–100 (start 50), hidden Toxicity, 3-card draft (one per type), card play, passive costs per phase, reputation decay, Ad-Fatigue / Echo-Chamber / Journalistieke Droogte, game overs (Bankroet, Verlaten Platform, Verbod & Regulering), phases 1–4 with goals, IPO win, events (milestone + Toxicity threshold) with three options.
- Mapping of absolute stats (users, revenue in EUR) next to the 0–100 meters (README).
- Content schema types (card, event, phase, balance) + small seed content as fixture/default.
- Seeded RNG in state (reproducible).
- Public API via `src/features/game-engine/index.ts`.

## Out of scope
- Will NOT do: UI, React hook, game juice/audio, end-report screen, full content deck (later content lap), persistence.
- Will NOT touch: `src/components/common/`, `src/shared/theme/tokens/`, `src/pages/`, `src/config/app-tasks.json`.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `src/features/game-engine/` | Not found | new feature folder + barrel | new — first rules code |
| `ARCHITECTURE.md` | lists features | feature list | ride — doc line |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size
M — one new feature, ~5 service modules with tests, schema types, README; no refactor of existing code.
Cut into laps: none (content and board are already separate backlog tasks per the orchestrator).

## Decisions
DECISIONS.md D1–D8.
