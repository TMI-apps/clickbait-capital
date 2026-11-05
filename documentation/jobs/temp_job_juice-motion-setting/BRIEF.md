# Brief — Game juice follows the Beweging setting

Task: follow-up of "Game feel: asymmetric juice and animations" (orchestrator, after game-settings #18) · Lap: temp_job_juice-motion-setting · Harness: v0.44.0

## Problem

Game juice read `prefers-reduced-motion` itself, so the in-app Beweging setting (game-settings) did not drive it, and "Volledig" could not bring juice back while the OS asks for reduced motion.

## Success check

With the OS asking for reduced motion: "Systeem" throws no particles, "Volledig" throws them with non-zero juice durations, "Verminderd" throws none (also without OS reduce); the state change (accents, deltas) always shows.

## In scope

- game-juice's internal `useMotionPreference` delegates to `useReducedMotion` from `@/features/game-settings/api`; no longer exported from the game-juice api.
- `src/index.css`: under `@media (prefers-reduced-motion: reduce)`, `:root[data-motion="full"]` restores only the juice durations; flash, glow and end entrance run on `duration-juice`.
- Decisions: amend game-settings D3 (log + README), game-juice D3 / D9.

## Out of scope

- Will NOT touch: game-settings code (store, panel), general UI motion (`duration-fast/normal/slow` keep following the OS).

## Edges

| Feature area  | Loop today                                    | Hook point                              | Ride / new |
| ------------- | --------------------------------------------- | --------------------------------------- | ---------- |
| game-juice    | own `matchMedia` hook                         | `hooks/useMotionPreference.ts`, api     | ride       |
| game-settings | `useReducedMotion`, `data-motion` on `<html>` | api import; README D3 line (docs only)  | ride       |
| index.css     | juice keyframes on tokens                     | `data-motion="full"` block              | ride       |
| game-board    | board tests                                   | Verminderd test in `GameBoard.test.tsx` | ride       |

## Size

XS — one hook body, one CSS block, tests and docs.

## Plan

1. Acceptance tests first: `src/features/game-juice/hooks/useActionJuice.test.tsx` (OS reduce mocked before the store exists: Systeem none, Volledig particles, Verminderd none; a board-level file would break game-board's components budget) and a Verminderd case in `GameBoard.test.tsx` (OS not reducing); `src/features/game-juice/services/juiceMotionCss.test.ts` (the full-motion block restores each juice duration to its `base.tokens.json` value, leaves general durations alone, juice animations run on `duration-juice`).
2. Delegate the hook; drop it from the game-juice api (no outside consumers).
3. CSS block + flash / end on `duration-juice`.
4. Docs: game-juice README D3 / D9, game-settings README D3 line, `DOC_DECISION_LOG.md` (juice-motion-setting D1–D2, game-settings D3 amended).
5. Gate: CI steps locally; Playwright on the preview with emulated OS reduce and the stored choice "full" / "reduced" (computed `--duration-juice`, particle count).

## Decisions

`documentation/DOC_DECISION_LOG.md` § juice-motion-setting D1 (orchestrator picked option A), D2.
