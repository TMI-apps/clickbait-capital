# Game save

The run in progress, saved on this device so a refresh, an app update or a closed phone app doesn't lose it. No accounts, no server.

## Purpose

- **What is stored (local-save D1):** `localStorage` key `clickbait-capital:run:v4` holds `{ version: 4, seed, actions }`, where `actions` are the card ids and event option ids in play order. The engine is pure and seeded, so game-session's `restoreSession` replays them into the identical game, feed and meter changes.
- **Validation (D2):** `readSavedRun` parses and shape-checks; bad JSON, a wrong shape or another version is removed and reads as "no save". Whether the actions are still legal is decided by the replay (game-session); a failing replay starts a new run and the session's persistence clears the key.
- **Lifetime (D3):** game-session writes after every action of a run in progress and clears when the run ends or has no actions (new game, restart). "Voortgang wissen" (game-settings) also removes it: the key starts with `GAME_STORAGE_PREFIX`.
- **Start choice (D4):** `useRunStart` decides how `/spel` opens: no save → new run; a save plus the start screen's router state (`{ run: "resume" | "new" }`) → that choice, then the state is replaced so a reload asks again; a save without state → `ask` (game-flow `ResumeScreen`).
- **Storage errors (D7):** every read, write and clear swallows exceptions (private mode, quota); the game plays on without a save.

## Structure

| Layer    | Path                          | Purpose                                                                                     |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`                | `useRunStart`, `readSavedRun`, `writeSavedRun`, `clearSavedRun`, `SAVED_RUN_VERSION`, types |
| Hooks    | `hooks/useRunStart.ts`        | How `/spel` starts: ask, resume or new; consumes the start screen's router state            |
| Services | `services/savedRunStorage.ts` | Versioned key, shape check, read / write / clear                                            |
| Types    | `types/savedRun.types.ts`     | `SavedRun`, `RunAction`, `RunStart`, `SAVED_RUN_VERSION`                                    |

## Decisions

- **Replay, not snapshot (D1):** smallest payload, the engine validates every step, and card texts in the feed come from the content, never from storage. Cost: a balance change in an app update can shift a resumed run's numbers; a removed card or option makes the replay fail and the save is dropped.
- **Silent discard (D2):** an unusable save starts a fresh game without a message (rare: only after a content change or tampering).
- **New schema:** bump `SAVED_RUN_VERSION`; the key changes with it, so old saves are ignored (and wiped by "Voortgang wissen") instead of migrated. Also bump it when an engine change makes an old action log replay into a different run. v2 (event-pacing lap): events open on other turns (game-engine D10), so a v1 log would lose its events or fail; v1 saves are ignored and the player starts a new run. v3 (shuffled-hand lap): hands draw other cards (shuffled-hand D1), so a v2 log no longer replays; v2 saves are ignored. v4 (score-redesign lap): users and money are absolute and scandals are drawn by chance (score-redesign D11, D19), so a v3 log replays into other numbers; v3 saves are ignored. v5 (balance-cleanup lap): each hand slot picks its type first (balance-cleanup D2) and Droogte is gone, so a v4 log draws other hands; v4 saves are ignored. v6 (deck-draw lap): hands come from per-type draw piles with a hand-mix roll (deck-draw D1–D4), so a v5 log draws other hands; v5 saves are ignored. v7 (exponential-growth lap): runs start at 0 users, growth compounds, fines scale with users and an urgent scandal can come before a milestone (exponential-growth D1–D3), so a v6 log replays into other numbers and events; v6 saves are ignored.

## Testing

Colocated Vitest: `services/savedRunStorage.test.ts` (round-trip, key, corrupt JSON, wrong shapes, other version, blocked storage). Replay and persistence: game-session `services/gameSession.test.ts` and `hooks/useGameSession.test.ts`; start choice: `src/pages/GamePage.test.tsx`, `src/pages/HomePage.test.tsx`.

## Dependencies

- `react-router-dom` (`useLocation`, `useNavigate`) for the start choice. No feature imports.
