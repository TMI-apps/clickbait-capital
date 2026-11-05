# Game engine

Rules engine and content schema for Clickbait Capital. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`.

## Purpose

- Runs one game as pure, immutable state transitions: `createGame` → `playCard` / `resolveEvent` until `status` is `won` or `lost`.
- Owns the content schema (cards, events, phases, balance) so content is data; the engine has no hard-coded deck.
- Reproducible: the seeded RNG state lives in `GameState`, so a seed plus the same choices replays the same game.
- No UI and no React. The game-board lap adds the hook and components in its own feature and imports `@/features/game-engine/api`.

## Structure

| Layer    | Path                         | Purpose                                                                                                                                                            |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API      | `api/index.ts`               | Public barrel: engine functions, `scaleForPhase`, `usersForMeter` and `meterForUsers` (so a UI shows the numbers the engine will apply), `SEED_CONTENT`, all types |
| Services | `services/gameEngine.ts`     | `createGame`, `playCard`, `resolveEvent`, `drawHand`, read helpers                                                                                                 |
| Services | `services/turnEffects.ts`    | Card modifiers (Ad-Fatigue, Echo-Chamber, Journalistieke Droogte), phase scaling, passive costs, reputation decay, clamping                                        |
| Services | `services/progression.ts`    | Absolute stats, phase goals, game overs, event triggers                                                                                                            |
| Services | `services/seededRandom.ts`   | mulberry32 RNG (`nextRandom`, `pickRandom`)                                                                                                                        |
| Services | `services/seedContent.ts`    | `SEED_CONTENT`: default balance, the four phases, a 6-card / 3-event seed deck (fixture; not tuned)                                                                |
| Types    | `types/gameContent.types.ts` | Content schema: `CardDefinition`, `EventDefinition`, `PhaseDefinition`, `BalanceConfig`, `GameContent`                                                             |
| Types    | `types/gameState.types.ts`   | `GameState`, `Hand`, `TurnReport`, `GameOverReason`                                                                                                                |

### Turn order (one card)

1. Card effects with modifiers: Ad-Fatigue (≥ 3 ads in the previous 4 plays: 50% revenue, 2× user loss), Echo-Chamber (viral streak ≥ 3: +50% users; +25 Toxicity once when the streak reaches 3), Droogte (≥ 5 turns without news before this play: viral Toxicity 2×).
2. Phase scaling: negative reputation × `reputationLossMultiplier`, positive revenue × `revenueGainMultiplier` (rounded half away from zero).
3. Every non-news card adds `newsIgnoredToxicity`.
4. Passive costs of the phase; reputation decay (−3 × `reputationLossMultiplier`) once `afterTurnsWithoutNews` turns passed without news.
5. Clamp meters and Toxicity to 0–100; add gross revenue; read users off the Gebruikers meter (D1); game over check.
6. Phase goal streak; next phase (phase 4: IPO win).
7. Event check (milestone events on entering their phase, then Toxicity events); otherwise a new draft.

Event options get phase scaling and stats, but no passive costs, decay or goal count (not a turn).

## Decisions

- **Absolute users and revenue (game-engine D1):** the design's 100k / 5M / 20M users and EUR 500k are stats next to the 0–100 meters. **Users are read off the Gebruikers meter:** `stats.users = round(meter × phase.usersAtFullMeter / 100)` (`usersForMeter`), the meter's share of the phase's market, so the number never contradicts the meter: it rises with it and is 0 only at Gebruikers 0 (= Verlaten Platform). One writer recomputes it before the goal check and on every exit through `advance`, so a new phase shows its bigger market behind the same meter (Bereik jumps up on a phase change). The same writer keeps `peakUsers`, the run's highest users stat, because the stat can fall with the meter and end screens report the peak. `meterForUsers` gives the lowest Gebruikers level that reaches a users target (throws for a phase without a positive market); the board names it in the goal line. **Revenue accumulates:** each card or event adds `positiveRevenueDelta × phase.revenuePerPoint` (`addGrossRevenue`; gross omzet, never falls, passive costs don't count), because the € 500k goal means total earned and a cumulative number cannot drift from a meter it never falls with. Goals read the stats; game overs read the meters. Replaced in users-stat-model: users accumulated `meterDelta × usersPerPoint` (floor 0), so they could reach 0 at a mid-range meter and one event could wipe millions.
- **Goals (D2):** one shape, `conditions` held for `consecutiveTurns` in a row. Phases 1–2 reach once; phase 3 is users ≥ 20M for 30 turns; the IPO is reputation > 60 and revenue meter > 80 for 10 turns.
- **Droogte (D3):** "scandal risk doubles" = a viral card's own Toxicity counts 2× (the news-ignored +2 and the Echo-Chamber +25 are not doubled), since Toxicity drives the scandal events; `isJournalismDroughtActive` tells the board to draw the red border.
- **Echo-Chamber (D4):** the +25 Toxicity fires once per streak, the +50% user bonus on every viral while the streak lasts.
- **Ad-Fatigue (D5):** checked against the previous 4 plays.
- **Events (D6):** each event fires at most once per game; milestones before Toxicity events; content order breaks ties.
- **Game-over priority (D7):** Bankroet, then Verlaten Platform, then Verbod & Regulering.
- **Decay scales per phase (D9):** reputation decay is multiplied by the phase's `reputationLossMultiplier` like other reputation loss (design § 6).
- **Identifiers (D8):** code ids are English (`revenue`, `users`, `reputation`, `viral` / `ad` / `news`, `bankrupt` / `abandoned` / `banned`); all player text is Dutch and lives in content.

## Not modelled yet

Design lines the engine does not implement as separate rules (content events or a later lap can add them): phase 2 competitors taking users when engagement drops and complaints about ad pressure; phase 3 fines that follow directly from ignoring news (today only via Toxicity events and phase-scaled decay); the end report of damage done (the board lap can derive it from `playedTypes` and stats).

## Testing

TDD, colocated `services/*.test.ts` (Vitest). `gameEngine.test.ts` § acceptance covers reproducibility, the three game overs and the IPO win.

## Dependencies

- None outside this feature (no React, Supabase or kit imports).
