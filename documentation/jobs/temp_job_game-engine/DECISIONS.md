# Decisions — game-engine

Job: `temp_job_game-engine`
Updated: 2026-11-04

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Absolute users / revenue vs 0–100 meters | closed | Separate accumulated stats: each turn the meter delta × the phase's `usersPerPoint` / `revenuePerPoint` is added to `stats.users` (can fall, floor 0) and positive revenue deltas to `stats.revenue` (omzet, gross, never falls). Goals read stats; game overs read meters. | loop-refine | clear-winner over "goal = meter threshold" (loses the 100k→20M scale) and a growth simulation (extra tuning, opaque). Task delegated the choice. |
| D2 | Phase 3 goal and IPO goal shape | closed | One generic "streak" goal: N consecutive turns with conditions (phase 3: users ≥ 20M for 30 turns; IPO: reputation > 60 and revenue meter > 80 for 10 turns). Phases 1–2: "reach" goals. | loop-refine | clear-winner: one mechanism for both |
| D3 | Journalistieke Droogte "scandal risk doubles" | closed | While active, viral cards add 2× Toxicity (events are Toxicity-driven) and state exposes `droughtActive` for the red border | loop-refine | clear-winner: engine has no separate scandal roll |
| D4 | Echo-Chamber repeat | closed | +50% user gain on every viral play while the viral streak ≥ 3; +25 Toxicity once when the streak reaches 3 | loop-refine | clear-winner: +25 every turn would end any game in 2 turns |
| D5 | Ad-Fatigue window | closed | An ad is fatigued when ≥ 3 of the previous 4 plays were ads: 50% revenue gain, 2× user loss | loop-refine | clear-winner reading of "binnen 4 beurten 3" + "elke volgende" |
| D6 | Toxicity event repeat | closed | Toxicity events fire when Toxicity > threshold (phase filter optional), each event at most once per game; milestone events fire on entering their phase | loop-refine | clear-winner: avoids firing every turn |
| D7 | Several meters at 0 in one turn | closed | Priority Bankroet → Verlaten Platform → Verbod & Regulering | loop-refine | clear-winner: deterministic |
| D8 | Identifiers | closed | Code ids in English (`revenue`, `users`, `reputation`, `viral`/`ad`/`news`); Dutch player text lives in content | loop-refine | clear-winner: repo code is English, vision: player text Dutch |

## Log

- 2026-11-04 — D1–D8 closed via loop-refine (clear-winner)
