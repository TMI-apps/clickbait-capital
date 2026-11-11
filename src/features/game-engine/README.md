# Game engine

Rules engine and content schema for Clickbait Capital. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`.

## Purpose

- Runs one game as pure, immutable state transitions: `createGame` → `playCard` / `resolveEvent` until `status` is `won` or `lost`.
- Owns the content schema (cards, events, phases, balance) so content is data; the engine has no hard-coded deck.
- Reproducible: the seeded RNG state lives in `GameState`, so a seed plus the same choices replays the same game.
- No UI and no React. The game-board lap adds the hook and components in its own feature and imports `@/features/game-engine/api`.

## Structure

| Layer    | Path                         | Purpose                                                                                                                                                                                                                            |
| -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`               | Public barrel: engine functions, `scaleForPhase`, `applyScore`, `usersChange`, `eventOptionEffects`, `scandalFine`, `scandalChance` and `goalReached` (so a UI shows the numbers the engine will apply), `SEED_CONTENT`, all types |
| Services | `services/gameEngine.ts`     | `createGame`, `playCard`, `resolveEvent`, read helpers                                                                                                                                                                             |
| Services | `services/drawDeck.ts`       | `drawHand`, `HAND_SIZE`, `rollHandTypes`: draw piles per type and the hand's type mix (deck-draw D1–D4)                                                                                                                            |
| Services | `services/turnEffects.ts`    | Card modifiers (Ad-Fatigue, Echo-Chamber), phase scaling , passive costs, reputation decay, clamping                                                                                                                               |
| Services | `services/progression.ts`    | Goal lines, the one game over, the scandal chance and draw, event triggers and pacing (`findTriggeredEvent`, `scheduleNextEvent`, D10)                                                                                             |
| Services | `services/seedContent.ts`    | `SEED_CONTENT`: default balance, the four phases, a 6-card / 3-event seed deck (fixture; not tuned)                                                                                                                                |
| Types    | `types/gameContent.types.ts` | Content schema: `CardDefinition`, `EventDefinition`, `PhaseDefinition`, `BalanceConfig` (incl. `handMix`), `GameContent`                                                                                                           |
| Types    | `types/gameState.types.ts`   | `GameState`, `Hand`, `DrawDeck`, `TurnReport`, `GameOverReason`                                                                                                                                                                    |

### Turn order (one card)

1. Card effects with modifiers: Ad-Fatigue (≥ 3 ads in the previous 4 plays: 50% revenue, 2× user loss), Echo-Chamber (viral streak ≥ 3: +50% users; +25 Toxicity once when the streak reaches 3). (Journalistieke Droogte is gone: balance-cleanup D1.)
2. Phase scaling: negative reputation × `reputationLossMultiplier`, positive revenue × `revenueGainMultiplier` (rounded half away from zero).
3. Every non-news card adds `newsIgnoredToxicity`.
4. Passive costs of the phase; reputation decay (−3 × `reputationLossMultiplier`) once `afterTurnsWithoutNews` turns passed without news.
5. Land the turn on the score (score-redesign D11, D26; exponential-growth D1): each users point of gain adds the phase's fixed `usersPerPoint` plus `userGrowthPerPoint` of the current users (growth compounds, and an app at 0 users can start), users losses take `userLossPerPoint` of the current users per point (floor 0); money gains pay `moneyPerUserPerPoint` euros per current user per point, costs × `moneyPerPoint`; reputation and Toxicity clamp to 0–100; Toxicity above `toxicityDrain.from` drains reputation (D21). Game over only when money is below € 0 (Bankroet, D16).
6. Both goal lines reached (users and money, D17): next phase (phase 4: IPO win). No streaks.
7. Event check under pacing (D10): at most one event per card turn, a due milestone first; otherwise, when pacing allows, a seeded roll against the scandal chance draws a scandal (D13, D22); otherwise a new draft.

Event options get phase scaling and land on the score like a card, plus the scandal fine (`finePoints` × (`moneyPerPoint` + `moneyPerUserPerPoint` × users), exponential-growth D2) when the event is a scandal (D25), but no passive costs, decay or goal check (not a turn).

## Decisions

- **Compounding growth (exponential-growth D1–D3):** users gains are a fixed base per point (`PhaseDefinition.usersPerPoint`) plus a share of the current users (`BalanceConfig.userGrowthPerPoint`); money gains are euros per current user per point (`BalanceConfig.moneyPerUserPerPoint`), replacing the capped audience factor (`audienceUsers`, score-redesign D20). `moneyPerPoint` is now only the price of costs, fines and paid options. The scandal fine adds `finePoints` × `moneyPerUserPerPoint` × users to its fixed part, so fines grow with the platform. When the scandal chance is at its maximum, the scandal roll comes before a due milestone and the milestone waits (`findTriggeredEvent`): otherwise milestones at every fast phase change used up the event slots and a toxic run never met its scandals. Saves moved to game-save v7.
- **Users and money are the score (score-redesign D11, replaces game-engine D1):** `GameState.users` and `money` are absolute and canonical; the Inkomsten/Gebruikers meters, `stats`, `usersForMeter`, `meterForUsers` and gross omzet are gone. Authored effects stay in points and each phase sets what a point is worth. `TurnReport.delta` is the absolute change of the turn (board, feed, juice). `peakUsers` stays for the end screens, since users can fall. Reputation and Toxicity are hidden 0–100 values (D13, D21).
- **Goals (score-redesign D17, replaces D2):** two goal lines per phase, `goal.users` and `goal.money`; the phase ends on the card turn both are reached. Events never end a phase on their own.
- **Droogte removed (balance-cleanup D1, replaces D3):** Journalistieke Droogte (viral Toxicity 2× after 5 turns without news, plus the board's red frame and notice) is gone with `isJournalismDroughtActive`, `TurnModifiers.journalismDrought` and `BalanceConfig.journalismDrought`. Under the score model Toxicity already saturates for a viral-heavy player and reputation is hidden, so the doubling barely changed a run and its notice warned about a value players can't see. Reputation decay after `afterTurnsWithoutNews` turns stays (score-redesign D21; balance-cleanup D3): it is the live news-neglect rule that feeds the scandal chance.
- **Echo-Chamber (D4):** the +25 Toxicity fires once per streak, the +50% user bonus on every viral while the streak lasts.
- **Ad-Fatigue (D5):** checked against the previous 4 plays.
- **Events (D6, score-redesign D14, D22):** a milestone fires once, from its phase on. Scandals (`trigger: { kind: "scandal", phases }`) are drawn by the scandal chance: 0 at or above `scandal.threshold`, rising to `maxChance` over `rampPoints` reputation points below it. The draw picks a random unfired scandal of the phase, or the one fired longest ago once all have fired, so scandals keep coming while reputation stays low. No scandal before the first card turn. A scandal at the maximum chance is urgent for pacing.
- **Event pacing (D10, event-pacing lap):** events are surprises spread over the run, not bursts (player feedback: too many right after each other). Rules, with `BalanceConfig.eventPacing`: (1) at most one event opens per card turn, so resolving an event always returns to a draft; (2) a regular (Toxicity) event waits `minTurnsBetween` plus a seeded 0…`randomExtraTurns` card turns after the previous event, drawn from the run RNG when an event opens (`scheduleNextEvent`), and the first regular event waits `minTurnsBetween` from the start; (3) urgent events skip the random gap but still wait `urgentMinTurnsBetween` (≥ 1): milestones, and scandals at the maximum chance (score-redesign D22; replaces the `crisisToxicity` rule); (4) a milestone is due from its phase on and stays due until it fires (carried to a later phase if pacing held it back), so milestones stay reliable; (5) the scandal roll only uses RNG state when a scandal can open, so runs without scandal risk replay as before. Pacing state is `lastEventTurn` / `nextEventTurn` in `GameState`, so a seed plus the same actions replays the same events. Rejected: a queue of triggered event ids (the triggers already re-check every turn, so a queue would duplicate state); a separate RNG stream for gaps (one run RNG keeps one source of randomness, D-reproducible). The random draw shifts later hands, so saves moved to game-save v2.
- **Draw deck (deck-draw D1–D4; replaces the per-slot type roll of balance-cleanup D2 and the memoryless draw of shuffled-hand D1):** `drawHand` (`services/drawDeck.ts`) keeps one draw pile per card type for the current phase in `GameState.deck` (top first). (1) The hand's type mix is one roll on `BalanceConfig.handMix` (weights 0.6 one of each, 0.35 two of one type plus one other, 0.05 three of one type; which types and the slot order are seeded), so every type still fills about 1/3 of the slots. (2) Each slot takes the top card of its type's pile, and every shown card, played or not, goes to the bottom of its pile: a card comes back only after the rest of its type has been shown (a pile of n cards guarantees at least floor((n − 3) / 3) + 1 hands: 3 for the 11 ads, 4 for 12; the simulation measures at least 5, median 11–14). (3) A phase change builds new piles: cards new to the deck are shuffled on top, cards the old piles held keep their order below them, so what was just shown stays at the bottom. (4) The last hand (`deck.lastHand`) is never shown in the next hand, also after an event or a phase change; only a phase with fewer than 6 cards may repeat one. A type with no card left to show hands its slot to another type (one the hand doesn't hold yet first). Three different cards per hand (shuffled-hand D2) and the throw below 3 cards stay. Saves moved to game-save v6.
- **Game-over priority (D7):** Bankroet, then Verlaten Platform, then Verbod & Regulering.
- **Decay scales per phase (D9):** reputation decay is multiplied by the phase's `reputationLossMultiplier` like other reputation loss (design § 6).
- **Identifiers (D8):** code ids are English (`revenue`, `users`, `reputation`, `viral` / `ad` / `news`, `bankrupt` / `abandoned` / `banned`); all player text is Dutch and lives in content.

## Not modelled yet

Design lines the engine does not implement as separate rules (content events or a later lap can add them): phase 2 competitors taking users when engagement drops and complaints about ad pressure; phase 3 fines that follow directly from ignoring news (today only via Toxicity events and phase-scaled decay); the end report of damage done (the board lap can derive it from `playedTypes` and stats).

## Testing

TDD, colocated `services/*.test.ts` (Vitest). `drawDeck.test.ts` covers the hand mix shares, shown cards to the bottom, the repeat gap, small pools and phase changes. `gameEngine.test.ts` § acceptance covers reproducibility, the three game overs and the IPO win.

## Dependencies

- `@/shared/utils/seededRandom` (mulberry32 `nextRandom`, `pickRandom`; moved to shared in the deck-draw lap since follower-comments uses it too). No React, Supabase or kit imports.
