# Decisions — users-stat-model

Job: `temp_job_users-stat-model`
Updated: 2026-11-05

## Closed

| id  | topic                     | status | choice                                                                                                          | source       | notes                                                                                                                                                                                                                             |
| --- | ------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Users stat formula        | closed | Linear: `round(meter × phase.usersAtFullMeter / 100)`; the meter is the share of the phase's reachable market   | loop-refine  | clear-winner over `floor × growth^meter`: a player reads it straight off the meter (meter 80 = 80 % of the market), monotone, 0 only at meter 0 (= Verlaten Platform game over). Exponential is not readable without a calculator |
| D2  | Stored or derived on read | closed | Stored in `GameState.stats` but recomputed by the engine after every transition (one function)                  | loop-refine  | clear-winner: board, endings, game-flow and the simulation read `stats.users` unchanged; one writer keeps it from drifting                                                                                                        |
| D3  | Phase change              | closed | Stat recomputed with the new phase's market: Bereik jumps up on entering a phase                                | loop-refine  | clear-winner: the new phase is a bigger market (scale-up, worldwide); the meter does not move, the market behind it does                                                                                                          |
| D4  | Revenue                   | closed | Unchanged: gross omzet accumulates positive revenue × `revenuePerPoint`, never falls                            | loop-refine  | clear-winner: it cannot show the bug (it never falls); "total earned" is the meaning of the € 500k goal; deriving it from a 0–100 meter would make the goal a meter goal                                                          |
| D6  | Phase markets             | closed | 115k / 5.3M / 22.5M / 30M (goals at Gebruikers 87 / 95 / 89)                                                    | loop-build   | entry Gebruikers 85–95 in the simulation; 95 keeps the phase 2 users goal real; content D9                                                                                                                                        |
| D7  | End-screen users number   | closed | Peak Bereik over the run (`GameState.peakUsers`, kept by the users-stat writer); results label "Hoogste bereik" | orchestrator | the IPO-phase stat (e.g. 11.4M at Gebruikers 38) read lower than the 20M a player held in phase 3                                                                                                                                 |
| D8  | Start reach 57.500        | closed | Accepted, no change                                                                                             | orchestrator | the phase 1 goal is 100k, so "nobody knows you yet" still holds at that scale                                                                                                                                                     |
| D5  | Board readout             | closed | Users goal line adds the Gebruikers level that reaches the goal (`Gebruikers ≥ N`), computed from content       | loop-refine  | goal progress reads as a meter target; no hard-coded numbers in copy                                                                                                                                                              |

## Open

| id  | topic | status | options briefly | blocked phase |
| --- | ----- | ------ | --------------- | ------------- |

## Log

- 2026-11-05 — D1–D5 closed via loop-refine (clear-winner)
- 2026-11-05 — D6 closed via loop-build (simulation tuning)
- 2026-11-05 — D7, D8 closed via orchestrator (Stop 2 feedback)
