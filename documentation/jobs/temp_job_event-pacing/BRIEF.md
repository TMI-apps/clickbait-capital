# Brief — Event pacing: world events as spread-out surprises

Task: player feedback via orchestrator (event pacing) · Lap: temp_job_event-pacing · Harness: v0.45.0

## Problem

World events pile up: after an event is resolved the engine immediately opens the next due one, and a phase entry opens its milestone right next to Toxicity events, so a human-like player sees 10 events in a 34-turn run, 54% of them on the same card turn as the previous event (median gap 0 turns).

## Success check

Over 60 seeds per simulated play style, no two events open on the same card turn, no regular event opens fewer than `minTurnsBetween` turns after the previous one, urgent events (milestones, crises at high Toxicity) never fewer than `urgentMinTurnsBetween`, every milestone of a reached phase still fires, the same seed + actions replays the same events, and the balance assertions (viral-only banned, ad-only abandoned, news-heavy bankrupt, human-like / rule-of-thumb / mixed win) still hold.

## In scope

- Engine: pacing state in `GameState` (`lastEventTurn`, `nextEventTurn`), a pure pacing step that picks at most one due event per card turn, a seeded random gap after each event (run RNG), milestones carried until they fire, crises allowed on the short urgent gap.
- Content schema + values: `BalanceConfig.eventPacing` (content-tunable), seed and full deck values.
- Simulation: pacing metrics (events per run, same-turn rate, back-to-back rate, median / min gap) and assertions.
- Save: bump `SAVED_RUN_VERSION` 1 → 2 (old action logs would replay into different events).
- Docs: game-engine, game-content, game-save READMEs; DOC_GAME_DESIGN if it states the event timing; decision log.

## Out of scope

- Will NOT touch: game-board / game-flow UI (parallel lap on event-choice juice and feed placeholder), event texts or options, card effects.
- Will NOT do: new event kinds or per-event priority fields in content (pacing classifies by trigger kind and Toxicity).

## Edges

| Feature area                                                     | Loop today                                                             | Hook point                                          | Ride / new                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| game-engine `advance` / progression                              | after every card or event resolution: first open triggered event fires | event selection + pacing state                      | ride — pacing in `progression.ts` next to the triggers |
| game-engine types                                                | `GameState`, `BalanceConfig`                                           | pacing fields                                       | ride                                                   |
| game-content `phases.ts` / simulation                            | `CONTENT_BALANCE`; 60-seed simulation                                  | `eventPacing` values; pacing metrics                | ride                                                   |
| game-save types                                                  | `SAVED_RUN_VERSION = 1`                                                | bump to 2                                           | ride                                                   |
| Test fixtures (game-session, game-board `GameBoard.test`, pages) | saved runs with `version: 1`; `EVENT_NOW` opens an event on turn 1     | `version: 2`; `EVENT_NOW` sets `minTurnsBetween: 1` | ride (test fixtures only, no UI code)                  |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one engine rule, one config block, simulation metrics, a version bump.
Cut into laps: none

## Plan (S)

1. Acceptance (failing first): `gameEngine.test.ts` § event pacing — one event per card turn, gaps ≥ `minTurnsBetween` (regular) / `urgentMinTurnsBetween` (urgent), milestones of reached phases fire, same seed + actions = same openings; `progression.test.ts` unit cases; simulation `pacing` metrics + assertions.
2. `EventPacingConfig` on `BalanceConfig`; `lastEventTurn` / `nextEventTurn` on `GameState`.
3. `services/progression.ts`: `findTriggeredEvent` gains pacing (snapshot adds `turn`, `lastEventTurn`, `nextEventTurn`), `scheduleNextEvent` on the run RNG; `advance` calls both. A separate `eventPacing.ts` would exceed the services budget (11 of 10 files), and triggers + pacing are one concern.
4. Values in `SEED_CONTENT` and `CONTENT_BALANCE`: 3 + 0–3, urgent 2, crisis Toxicity 70.
5. Simulation before/after; retune only if an assertion breaks.
6. `SAVED_RUN_VERSION` 2; READMEs, design doc § Type 2, decision log.

Precedent: cooldown + random jitter + priority bypass for urgent events is the usual pacing pattern for card/event games ("storyteller" pacing in colony sims, event cooldowns in strategy games); no package applies (a dozen lines of pure logic on the existing seeded RNG).

## Decisions

DECISIONS.md D1–D6
