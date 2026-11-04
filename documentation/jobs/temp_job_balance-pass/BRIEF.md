# Brief — Balance pass from play-tests

Task: Balance pass from play-tests · Lap: temp_job_balance-pass · Thread of an orchestrated run (orchestrator owns product decisions and merge)

## Problem

A good run takes ~63 turns (phase 3's 30-turn hold is half of it), a balanced rotation can sit in phase 1 for dozens of turns, and the simulation's only "good player" reads hidden Toxicity, so nothing measures what a human can do.

## Success check

`balanceSimulation.test.ts` has a `humanLike` strategy that uses only board-visible information; its median run is 25–45 turns and it wins the IPO in at least half of 60 seeds, while viral-only still ends in Verbod, ad-only in Verlaten and news-heavy in Bankroet.

## In scope

- `humanLike` (visible-info lookahead) and the play-test rotation V/A/N/N/A as simulated strategies; p10–p90 run length in the summary.
- Tune `CONTENT_PHASES` / `CONTENT_BALANCE` (content data) for run length.
- Phase 3 hold 30 → 12 (orchestrator-authorised) in data and `DOC_GAME_DESIGN.md` § 6 with a change note.
- README balance table and decision (D8).

## Out of scope

- Will NOT do: engine stat model change (users stat from the meter) — proposed to the orchestrator as its own task.
- Will NOT do: board feedback for gains capped at 100 — game-board area, suggested as a backlog item.
- Will NOT touch: game-engine, game-board, game-flow, game-audio, `app-tasks.json`.

## Edges

| Feature area  | Loop today              | Hook point                                                | Ride / new                |
| ------------- | ----------------------- | --------------------------------------------------------- | ------------------------- |
| game-content  | `GAME_CONTENT` → engine | `services/phases.ts`, `balanceSimulation.test.ts`, README | ride — data and test only |
| documentation | design SSOT             | `DOC_GAME_DESIGN.md` § 6 Fase 3 goal                      | ride — one value + note   |

## Size

S — one data file, one test file, two docs.
Cut into laps: none (follow-ups proposed to the orchestrator: meter-derived users stat; capped-gain feedback on the board).

## Plan (S)

1. Acceptance: add `humanLike` + `rotateFive` and the 25–45 / win ≥ 50 % assertions (fail on main: 62–74 turns).
2. Sweep phase-1 users/point, phase-3 hold, phase-4 cost and reputation multiplier; pick the smallest change set that passes.
3. Update phase-4 tip copy (×2.5), README D5/D8 + table, design § 6.
4. Gates: `pnpm vitest run src/features/game-content`, lint, type-check, validate scripts; Playwright runs on the preview.

## Decisions

- Phase 1 users/point 2,500; phase 3 hold 12; phase 4 cost −6, reputation loss ×2.5 (README D8).
