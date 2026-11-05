# Development plan: Move session state into a game-session feature

## Summary

- **Goal:** `src/features/game-session/` owns one run (reducer, replay, device save, `useGameSession`); game-board keeps the board UI and reads the session through `@/features/game-session/api`.
- **Why:** two bounded concepts in one feature; game-board over the 25-file default under a temporary override (local-save D9).
- **Brief:** `BRIEF.md`
- **Size:** M — two features, moved tests, session-state shape change, browser regression.
- **Acceptance test:** `src/features/game-session/hooks/useGameSession.test.ts` (imports from the new feature; fails until it exists) + `pnpm validate:feature-size` without the override.
- **Plan review:** Done 2026-11-05 (`plan-review.md`)
- **Scope / constraints:** no user-visible change, no new dependency, no protected-file edit, no baseline edit.

## Design

The current `SessionState` stores board view models (`feed: FeedEntry[]`, `sounds: BoardSounds`) produced by game-board services. Moving it as-is would make game-session import game-board while game-board imports game-session (cycle). The session therefore stores neutral facts and the board derives its views:

```ts
// game-session/services/gameSession.ts (types stay with the service: a types file may not import the engine / game-save barrels)
interface SessionStep {
  action: RunAction;
  turn: number;
  eventId: string | null;
}
interface SessionState {
  game: GameState;
  previous: GameState | null; // state before the last action (kept by a replay)
  steps: SessionStep[]; // every accepted action, oldest first (the save's actions)
  replayedSteps: number; // steps rebuilt from a save: a resume is silent
}
```

- `toSavedRun` maps `steps` → `actions` (format unchanged, local-save D1).
- game-board `services/boardView.ts`: `toFeed(steps, content)` (newest first, same keys as `feedEntryForCard` / `feedEntryForEvent`); meter deltas from `previousGame?.meters ?? null`.
- game-board `services/boardSounds.ts`: `soundsForLastStep(session, content)` → `BoardSounds` with `key = steps.length`; empty when `steps.length <= replayedStepCount`. Same ids and order as today (fresh run / restart / resume: none; each live action: `soundsForAction`).
- game-board `hooks/useBoardSession.ts` (replaces the board half of the old hook): `useGameSession` + memoized `BoardView` + sounds, same return shape `GameBoard` uses today.

## Phase overview

| Phase | Goal                                                                                                 | Gate                                                                  | Status  |
| ----- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1     | game-session feature: service (+ types) + test, hook + test, api, README                             | `pnpm test:run` for the two files, type-check                         | Done    |
| 2     | game-board on the barrel: `useBoardSession` + test, `toFeed`, `soundsForLastStep`, old files removed | full tooling gate (`rule-audit.md` § Tooling pass)                    | Done    |
| 3     | Override removed, READMEs, decision log, ARCHITECTURE                                                | `validate:feature-size`, `validate:feature-docs:strict`, `arch:check` | Done    |
| 4     | Browser regression 390px on preview + balance sim + bundle budget                                    | Playwright script, `pnpm build` size                                  | Pending |

## Conflict & compliance

- Applicable rules: architecture (feature granularity, layers, cross-feature via barrel), code-style § Naming (F3/F4), file-placement, testing.
- File placements: `src/features/game-session/{api,hooks,services,types}/`, README at root — standard feature layout (`pnpm validate:structure`).
- Reuse / packages: skipped — pure move of bespoke game logic.
- Foundation cleanup: the session no longer carries board view models (deepen-modules: one concept per module).
- Risks: sound keying on resume/restart (covered by tests); feed key identity (same mappers).
- Standards diversions: none.

## Review contract

- **Rules pinned:** `rules@af789e7` — architecture, code-style, file-placement, testing
- **Required lenses:** Naming, Feature decomposition, Foundation cleanup; Pattern & precedent skipped (no new behavioral contract); Reuse skipped (bespoke logic)
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** local-save D1–D9, game-board D12 (sounds computed per action — now derived by the board from the session's last step)

### Amendments

| #   | Date       | Source                        | Change                                                                                                                            | Applied to        |
| --- | ---------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| A1  | 2026-11-05 | plan-review (contract)        | Session types stay in `services/gameSession.ts`, no `types/` file (`no-non-types-in-types`: a types file may not import a barrel) | Design, Phase 1   |
| A2  | 2026-11-05 | plan-review (advisory, taken) | Field names `previousGame`, `replayedStepCount`; `seenPhase` from the restored `previousGame.phase`; `toFeed` key test            | Design, Phase 1–2 |

## Pattern & precedent

**Pattern review:** skipped — structural refactor, no new user-facing or API contract.

## Notes during development

- Plan review advisory not taken: drop `replayedStepCount` and skip the mount key in `useBoardSounds` instead. Kept: "these steps were replayed" is a fact of the run, and it keeps the board hook free of mount tracking.
- ARCHITECTURE.md lists no individual features: no change needed.

## Decisions made

| #   | Topic         | Choice                                                                                                                          | Precedent?                                |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Session shape | Neutral steps + `previous` + `replayedSteps`; board derives feed, deltas and sounds                                             | Event-sourced store, views as projections |
| 2   | Names         | `game-session` keeps `useGameSession` / `gameSession.ts` (already role names at the new level); board wrapper `useBoardSession` | —                                         |
