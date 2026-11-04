# Decisions — game-content

Job: `temp_job_game-content`
Updated: 2026-11-04

## Closed

| id  | topic                                                            | status | choice                                                                                                       | source      | notes                                                                                                                             |
| --- | ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Data format                                                      | closed | Typed TS data in `services/*.ts` (not JSON)                                                                  | loop-refine | clear-winner: whitelist has no data folder; TS gives compile-time checks against the engine schema, same as `seedContent.ts`      |
| D2  | Presentation fields (flavor, imageTheme, imageAlt, phase intros) | closed | Own types in game-content extending engine types; no engine schema change                                    | loop-refine | clear-winner: structural typing lets `ContentCard` pass as `CardDefinition`                                                       |
| D3  | Intended loss per pure strategy                                  | closed | viral-only → banned; ad-only → abandoned; news-heavy (news + viral, no ads) → bankrupt                       | loop-refine | clear-winner from design § 2/§ 4: viral feeds Toxicity, ads cost users, news earns €0                                             |
| D4  | "Not modelled yet" items                                         | closed | As events: competitors + ad-pressure in phase 2, fines + hearings in phase 3 (milestone / toxicity triggers) | loop-refine | engine README allows content events; no new rules                                                                                 |
| D5  | Balance retune                                                   | closed | Content owns its own phases + balance (copied from SEED_CONTENT, retuned only where the simulation needs it) | loop-refine | schema says "a content lap may retune them"                                                                                       |
| D6  | UI copy home                                                     | closed | `uiCopy.ts` constant `UI_COPY` grouped by screen, exported via the api barrel                                | loop-refine | UI laps import it; no i18n library (Dutch only, vision)                                                                           |
| D7  | End report numbers                                               | closed | Derived from the run with fixed satirical scale factors                                                      | loop-build  | clear-winner: design asks to show damage; engine README says board can derive it from playedTypes + stats                         |
| D8  | Server costs                                                     | closed | Phase 3 −6, phase 4 −7 (seed −5/−6); phase 1 usersPerPoint 2,000 (seed 5,000); shitstorm threshold 25        | loop-build  | simulation: seed costs let the lookahead win every run in minimum turns; phase 1 lasted 2 turns (review finding, orchestrator OK) |

## Open

| id  | topic | status | options briefly | blocked phase |
| --- | ----- | ------ | --------------- | ------------- |

## Log

- 2026-11-04 — D1–D6 closed via loop-refine (clear-winner)
