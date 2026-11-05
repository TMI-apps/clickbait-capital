# Brief — Split game-board into board + game-session

Task: Split game-board into board + game-session · Lap: temp_job_game-session-split · Harness: v0.45.0

## Problem

game-board mixes two domain concepts — the run (engine state, action log, replay, device save) and the board UI — and sits at 27 files under a temporary budget override (local-save D9).

## Success check

`src/features/game-session/` exists with an `api/index.ts` barrel and README; game-board imports the session only through that barrel and holds ≤ 25 files without an override; `pnpm arch:check`, `validate:feature-size`, the full test suite and a 390px Playwright regression (play, reload → Verder spelen restores the identical board, finish → results + Deel je resultaat) pass unchanged.

## In scope

- New feature `game-session`: the pure session reducer and replay (`startSession`, `applyAction`, `restoreSession`, `toSavedRun`) and the `useGameSession` hook (run state, `play`, `chooseOption`, `restart`, `resumed`, `seenPhase`, device save), with their tests.
- The session holds no board view models: it records each accepted step (action, turn, event id) and the state before the last action; game-board derives the feed, meter deltas and sounds from it (`useBoardSession`).
- Remove the `game-board` override from `featureBudgets.config.cjs`.
- READMEs (game-board, game-save, new game-session), `DOC_DECISION_LOG.md` section, `ARCHITECTURE.md` if it lists features.

## Out of scope

- Will NOT do: any user-visible change (copy, timing, sounds, save format).
- Will NOT touch: the save format `{ version: 1, seed, actions }` (local-save D1), game-flow, game-save storage, app-update, result-share.

## Edges

| Feature area              | Loop today                                            | Hook point                                                                | Ride / new                      |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| game-board                | `GameBoard` → `useGameSession` → engine + `BoardView` | `GameBoard` calls `useBoardSession` (wraps `@/features/game-session/api`) | ride                            |
| game-session              | Not found                                             | new feature                                                               | new — bounded concept "one run" |
| game-save                 | `useGameSession` writes / clears through its barrel   | unchanged API; README test pointers                                       | ride                            |
| featureBudgets.config.cjs | override `game-board` 27                              | remove                                                                    | ride                            |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — two features, moved tests, a session-state shape change and a browser regression.
Cut into laps: none.

## Decisions

Task decisions came from the orchestrator's task text (split, barrel, remove override). Implementation decisions: `DEVELOPMENT_PLAN.md` § Decisions made; recorded in `DOC_DECISION_LOG.md` § game-session-split.
