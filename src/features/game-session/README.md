# Game session

One run of Clickbait Capital over the rules engine: the engine state, every accepted player action, the replay of a saved run and keeping the device save in step. Views (the board) derive what they show from it. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`; engine: `src/features/game-engine/README.md`.

## Purpose

- Holds one run: `SessionState` = engine `game`, `previousGame` (state before the last action), `steps` (each accepted action with its turn, answered event and the engine `state` right after it, oldest first) and `replayedStepCount` (steps rebuilt from a save).
- Takes player actions (`play`, `chooseOption`), ignores ones the run can't take now (same session object back), and starts fresh runs (`restart`).
- Saves and resumes (local-save D1–D3): writes `{ version, seed, actions }` through `@/features/game-save/api` after each action, clears it when the run ends or has no actions, and replays a `savedRun` (a save that no longer replays starts a new run).
- "Session" is the in-memory run; game-save and the engine speak of the _run_ (`RunAction`, `SavedRun`) that a session plays and stores.

## Structure

| Layer    | Path                      | Purpose                                                                                                             |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`            | `useGameSession`, types `GameSession`, `UseGameSessionOptions`, `SessionState`, `SessionStep`                       |
| Hooks    | `hooks/useGameSession.ts` | The run in React state: `session`, `status`, `play`, `chooseOption`, `restart`, `resumed`, `seenPhase`; device save |
| Services | `services/gameSession.ts` | Pure: `startSession`, `applyAction`, `restoreSession` (replay of a save), `toSavedRun`                              |

## Decisions

- **App name with the run (app-name AN1):** `SessionState.appName` is set by `startSession(content, seed, appName)`, kept by every action (`advance` copies the session) and by `restart`, written to `SavedRun.appName` and read back by `restoreSession`. The engine never sees it. Runs without one (older saves, tests) show "Jouw app".
- **Facts, not views (game-session-split D1):** the session stores engine states and steps only; feed posts, score readouts, the score chart's history (`SessionStep.state` users and money, score-redesign D10) and sounds are the board's projections (`useBoardSession`). This keeps the dependency one-way (game-board → game-session) and the session free of view models.
- **Silent resume (local-save D5, game-session-split D1):** `restoreSession` marks all replayed steps (`replayedStepCount`), so a view knows their effects already happened; it keeps `previousGame`, so meter deltas after a resume are identical.
- **State per step (feed-comments D3):** every step keeps the engine state after it, so a view can derive per-post facts for older posts too (the follower comments under each feed post). The replay rebuilds them, so the save stays `{ version, seed, actions }` and `SAVED_RUN_VERSION` is unchanged.
- **Interrupted phase intro (local-save D5):** `seenPhase` is `previousGame.phase` of the restored run (0 for a new run), so an intro the reload interrupted shows again.

## Testing

Colocated Vitest: `services/gameSession.test.ts` (replay identity, rejected or ending replays, replayed step count, step facts), `hooks/useGameSession.test.ts` (acceptance: a scripted player reaches an end; restart; rejected action keeps the session; save written, resumed identically, discarded, cleared on end and restart). Board-level behavior (feed, sounds, view identity on resume): game-board `hooks/useBoardSession.test.ts`. Save fixtures carry the current `SAVED_RUN_VERSION` (7 since the exponential-growth lap; game-save README).

## Dependencies

- `@/features/game-engine/api` (`createGame`, `playCard`, `resolveEvent`, `getPendingEvent`, `GameContent`, `GameState`).
- `@/features/game-save/api` (`writeSavedRun`, `clearSavedRun`, `SAVED_RUN_VERSION`, `SavedRun`, `RunAction`).
- Consumer: game-board (`useBoardSession`).
