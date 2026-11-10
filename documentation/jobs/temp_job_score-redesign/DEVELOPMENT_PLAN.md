# Development plan: Score redesign — build (L1–L3)

## Summary

- **Goal:** Gebruikers and Geld become the score. Card and event effects land straight on them, the phase goal is two goal lines, the only game over is Geld below € 0, and scandals come from a visible per-turn chance once hidden reputation drops below a threshold.
- **Why:** owner — the relation between the three bars and the score is hard to see. Owner decisions D10–D17 (2026-11-10).
- **Brief:** `BRIEF.md` · **Decisions:** `DECISIONS.md` D10–D24 (D1–D9 are lap 0, the design + mockup in PR #50; partly superseded)
- **Size:** M+ overall, cut into three laps (each ≤ M, each its own branch and ready PR with a preview):

| Lap | Branch                | Scope                                                                                                                                                                | Size |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| L1  | `feat/score-engine`   | engine model, content data, balance simulation, save bump, endings without Verlaten/Verbod, interim board tiles (D23)                                                | M    |
| L2  | `feat/score-chart`    | `ScoreChart` replaces the tiles; forecast on drag + detail dialog; card faces (D15); scandal warning styling; juice + screen reader; delete the mockup if #50 landed | M    |
| L3  | `feat/score-end-copy` | result + share card + end report copy for users/money, how-to-play, glossary, DOC_GAME_DESIGN § 2/6/7, phase intros                                                  | S    |

- **Acceptance test (L1):** `src/features/game-engine/services/gameEngine.test.ts` § score model (direct effects on users/money, goal lines advance the phase, bankrupt only, scandal chance draws a scandal) + `src/features/game-content/services/balanceSimulation.test.ts` (endings per strategy).
- **Plan review:** single-agent lenses in this lap (below). L2 gets a short plan in its own lap section when it starts.

## L1 phase overview

| Phase | Goal                                                                                                                        | Gate                                     | Status  |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------- |
| 1     | Engine types + model (state, turn math, progression, scandal draw, game over) with unit tests                               | engine tests green, type-check of engine | Done    |
| 2     | Content: phases (scales, goals), balance (scandal, drain), events retagged `scandal`, endings without Verlaten/Verbod       | gameContent tests                        | Done    |
| 3     | Balance simulation rewritten for the new model and tuned                                                                    | simulation assertions green              | Done    |
| 4     | Consumers: game-save bump, follower-comments, game-flow end screens, game-board interim tiles + scandal line, speech/sounds | full tooling gate                        | Done    |
| 5     | Browser check on the preview: play to phase 2, see scandal warning, bankrupt ending                                         | screenshots read                         | Pending |

## L1 model (SSOT until DOC_GAME_DESIGN is rewritten in L3)

- **State:** `users`, `money` (absolute integers), `reputation`, `toxicity` (hidden 0–100), `peakUsers`. Removed: `meters`, `stats`, `goalStreak`. `TurnReport.delta = { users, money }` is the absolute change of the turn (board juice, feed, forecast in L2).
- **Effects:** authored points stay (`Effects`), as do the modifiers (ad fatigue, echo chamber, drought) and the phase multipliers. Then: users Δ = points × `usersPerPoint`; money Δ = card gain × `moneyPerPoint` × audience (D20) + passive cost points × `moneyPerPoint`; reputation Δ = points − round(toxicity × `toxicityDrain`) (D21) − decay; users floor 0, reputation and toxicity clamp to 0–100.
- **Progression:** a phase ends on the turn users ≥ goal.users and money ≥ goal.money (D17); phase 4 → won. Game over only when money < 0 (D16).
- **Scandals:** `scandalChance(reputation) = reputation ≥ threshold ? 0 : min(max, max × (threshold − reputation) / rampPoints)`, drawn per D22 within event pacing; milestone events first, as today.

## Conflict & compliance

- Applicable rules: architecture (layers; content stays data; the engine stays pure + seeded), code-style § Naming, testing (TDD for the engine: pure functions; expected values from the shipped content), file-placement, agent-behavior (no protected files touched), git-workflow (Model C).
- File placements: no new feature. New engine module `services/scandal.ts` (pure) only if `progression.ts` passes the complexity limits; otherwise it stays in progression.
- Reuse: seeded RNG (`seededRandom`), event pacing (`scheduleNextEvent`) and modifiers are reused as they are.
- Foundation cleanup: `usersForMeter`, `meterForUsers`, `addGrossRevenue`, `GoalCondition`, `StatKey`, `goalStreak`, and the streak copy/UI are deleted, not left as husks.
- Data / irreversible: the save version bump (D19) discards in-progress local runs once. It is local storage only, with no server data, and the existing version-mismatch path handles it.
- Risks: (1) balance: unbounded numbers can run away. Mitigated by the audience factor, phase costs and the simulation. (2) The scandal pool per phase: repeats are allowed (D22). (3) Board juice is keyed per meter; L1 keeps the `revenue`/`users` keys for the two tiles.

## Review contract

- **Rules pinned:** `rules@af789e7` — architecture, code-style, testing, file-placement, agent-behavior, git-workflow
- **Required lenses:** Pattern & precedent (lap 0 + below), Reuse (RNG, pacing), Feature decomposition (no new feature; engine/content/board split kept), Foundation cleanup (above), Naming (`ScoreKey`, `scandalChance`, `audienceUsers`: role names)
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** DECISIONS D10–D24

### Amendments

| #   | Date | Source | Change | Applied to |
| --- | ---- | ------ | ------ | ---------- |

## Pattern & precedent

| Field                | Value                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability**       | Two absolute score numbers that every choice moves, with goal lines and a visible risk percentage                                                                                                                                                                         |
| **Precedents**       | Stock and portfolio apps (value line + target); Kairosoft / Game Dev Story (fans + money as the score); XCOM hit chance / Into the Breach (risk shown as a number before acting); Reigns (hidden pressure that only shows near the edge)                                  |
| **Aspects reviewed** | Salience of the score; causality per choice; risk communication; failure states                                                                                                                                                                                           |
| **Findings**         | Salience and causality align (absolute numbers + forecast). A risk percentage aligns with XCOM-style shown odds; kids read "35% kans" well. A single failure state (bankrupt) matches tycoon games, and the audience factor keeps ad spam from being a dominant strategy. |
| **Verdict**          | Aligns with precedent                                                                                                                                                                                                                                                     |

## Notes during development

- The first model (users × usersPerPoint for gains and losses, goals ×10 per phase) failed the simulation: a news card right after a phase change wiped a third of the users, and rule-of-thumb won 0–13 of 60. A fully relative model compounded growth (viral-only won 33 of 60). The kept model has gains per phase and relative losses (D26), goals about 3× per phase, a fine per scandal (D25) and a drain only above toxicity 50 (D21).
- The juice's news shield accent had the Reputatie tile as its target; with reputation hidden it shows nowhere. L2 decides whether news gets another dull cue.
- `DOC_GAME_DESIGN.md` § 2, 6, 7 are rewritten in L3; until then a note at the top of those sections points to this lap's decisions.
- Follower comments still read the hidden reputation (complain below 45, critics leave below 25), so the chat hints that trust is falling before the scandal warning shows. This was kept on purpose: it is in-world and does not show a number.

## Decisions made

| #   | Topic | Choice | Precedent? |
| --- | ----- | ------ | ---------- |
