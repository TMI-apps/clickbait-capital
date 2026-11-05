# Decisions — local-save

Job: `temp_job_local-save`
Updated: 2026-11-05

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | What is stored | closed | `{ version: 1, seed, actions }` (card ids and event option ids in order) under `clickbait-capital:run:v1`; resume replays them through the engine | loop-refine | clear-winner over a `GameState` + feed snapshot: smallest payload, the engine itself validates every step, the feed and meter deltas rebuild from content (no stale copy in storage). Cost: a balance change in an update can shift a resumed run's numbers; a removed card or option makes the replay fail and the save is discarded |
| D2 | Invalid save | closed | Bad JSON, wrong shape, other version, rejected action or a replay that ends the run → key removed, fresh game, no message | loop-refine | brief: discard safely, no crash; `errors.loadFailed` copy stays unused (would need a new notice surface for a rare case) |
| D3 | When it is written / cleared | closed | After every action while the run is in progress; cleared when it ends (won/lost) or the session has no actions (new game, restart) | loop-refine | clear-winner: a save with zero actions would offer to resume nothing |
| D4 | Where the offer shows | closed | Home: "Verder spelen" (primary) + "Nieuw spel" when a shape-valid save exists, else "Start spel". `/spel` on every page load with a save: `ResumeScreen` unless Home's button already chose (router state, consumed with a replace so a reload asks again) | loop-refine | the installed app opens `/spel` (`start_url`), so the offer must also live there; "Nieuw spel" overwrites the old save (no extra confirm: the choice is explicit) |
| D5 | Screen reader on resume | closed | Resumed board skips the phase intro (unless the last action started the phase: then the intro shows again, game-flow D2 order), focuses the board heading (screen-reader D2) and speaks "Spel hervat. Fase N van 4: <naam>. Beurt T." once in the existing polite region (queued behind an open event dialog per screen-reader D1) | loop-refine | the heading alone names the phase but not the turn |
| D6 | app-update D1 | closed | Policy and banner unchanged; rationale updated: a reload now resumes the run via the offer, but still interrupts play, so updates still wait for a safe moment | loop-refine | simplifying to "reload any time" would throw the player onto the resume screen mid-turn |
| D7 | Storage errors | closed | Read/write/clear swallow exceptions (private mode, quota); the game plays on without saving | loop-refine | same pattern as `muteStorage` / `gameStorage` |
| D8 | Pause-menu "Stoppen" | closed | Keeps the save: Home then offers "Verder spelen" | loop-refine | consistent with closing the app; the unused `board.quitConfirm` copy ("voortgang gaat verloren") is removed as untrue |
| D9 | game-board file budget | closed | `featureBudgets.config.cjs` override `game-board` → 27 files, reason "session reducer + replay for local save (local-save D1); split board/session later if it grows" | orchestrator (option A) | rejected: pure session code back in the hook (placement rule), splitting game-board now (size M); split queued as a backlog task |

## Open

| id | topic | status | options briefly | blocked phase |
|----|-------|--------|-----------------|---------------|

## Log

- 2026-11-05 — D1–D8 closed via loop-refine (clear-winner)
- 2026-11-05 — D9 closed via orchestrator (option A)
