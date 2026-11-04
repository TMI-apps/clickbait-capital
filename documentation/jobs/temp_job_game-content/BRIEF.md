# Brief — Game content: cards, events and UI copy

Task: Game content: cards, events and UI copy · Lap: temp_job_game-content · Harness: v0.44.0

## Problem

The engine runs on a 6-card fixture; players need a full, balanced Dutch deck, events and all player-facing copy before the board and UI laps can ship a playable game.

## Success check

`src/features/game-content/api` exports a `GameContent` the engine accepts (≥ 15 cards per type, ≥ 8 per type in every phase, every event exactly three options with kinds commercial/engagement/journalism), and a seeded simulation test shows viral-only ends `banned`, ad-only ends `abandoned`, news-heavy ends `bankrupt`, and a mixed strategy reaches phase 3 or later in most seeds.

## In scope

- New feature `src/features/game-content/` (README, types, services data, api barrel).
- Card pool per type and phase: id, title, body, flavor text, effects, phases, imageTheme + imageAlt hints.
- Event cards (three policy options each): Verkiezingen & Desinformatie; phase 2 competitors and ad-pressure complaints; phase 3 fines and hearings; milestone events; toxicity boomerangs.
- Phases + balance (content may retune constants; engine rules untouched), phase intros, three game-over texts, IPO end report templates with a pure filler function.
- UI copy data: board, events, results, settings, credits, errors, empty states, tutorial lines.
- Integrity test + balance simulation test with scripted strategies; a fresh tone/balance review pass.

## Out of scope

- Will NOT do: images (later imagery lap uses the card ids + hints), UI components, hooks, pages.
- Will NOT touch: `src/features/game-engine/` (rules and schema), `src/components/common/`, `src/shared/theme/`, `src/pages/`, `src/App.tsx`, `src/config/app-tasks.json`.

## Edges

| Feature area | Loop today                                                                   | Hook point                                     | Ride / new                  |
| ------------ | ---------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------- |
| game-engine  | `createGame/playCard/resolveEvent` over `GameContent` (SEED_CONTENT fixture) | `@/features/game-engine/api` types + functions | ride — consumer only        |
| game-content | Not found                                                                    | `@/features/game-content/api`                  | new — content as typed data |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — one new feature, large data volume, simulation tuning; no refactor.
Cut into laps: none

## Decisions

DECISIONS.md D1–D8.
