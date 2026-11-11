# Game engine

Rules engine and content schema for Clickbait Capital. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`.

## Purpose

- Runs one game as pure, immutable state transitions: `createGame` → `playCard` / `resolveEvent` until `status` is `won` or `lost`.
- Owns the content schema (cards, events, phases, balance) so content is data; the engine has no hard-coded deck.
- Reproducible: the seeded RNG state lives in `GameState`, so a seed plus the same choices replays the same game.
- No UI and no React. The game-board lap adds the hook and components in its own feature and imports `@/features/game-engine/api`.

## Structure

| Layer    | Path                         | Purpose                                                                                                                                                                                                                                                                                                                                             |
| -------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`               | Public barrel: engine functions, `scaleForPhase`, `applyScore`, `audienceFactor`, `eventOptionEffects`, `scandalFine`, `scandalChance` and `goalReached` (so a UI shows the numbers the engine will apply), `SEED_CONTENT`, `nextRandom` (seeded draws for presentation that must replay, e.g. the follower comments; never the run RNG), all types |
| Services | `services/gameEngine.ts`     | `createGame`, `playCard`, `resolveEvent`, `drawHand`, `HAND_SIZE`, read helpers                                                                                                                                                                                                                                                                     |
| Services | `services/turnEffects.ts`    | Card modifiers (Ad-Fatigue, Echo-Chamber), phase scaling , passive costs, reputation decay, clamping                                                                                                                                                                                                                                                |
| Services | `services/progression.ts`    | Goal lines, the one game over, the scandal chance and draw, event triggers and pacing (`findTriggeredEvent`, `scheduleNextEvent`, D10)                                                                                                                                                                                                              |
| Services | `services/seededRandom.ts`   | mulberry32 RNG (`nextRandom`, `pickRandom`)                                                                                                                                                                                                                                                                                                         |
| Services | `services/seedContent.ts`    | `SEED_CONTENT`: default balance, the four phases, a 6-card / 3-event seed deck (fixture; not tuned)                                                                                                                                                                                                                                                 |
| Types    | `types/gameContent.types.ts` | Content schema: `CardDefinition`, `EventDefinition`, `PhaseDefinition`, `BalanceConfig`, `GameContent`                                                                                                                                                                                                                                              |
| Types    | `types/gameState.types.ts`   | `GameState`, `Hand`, `TurnReport`, `GameOverReason`                                                                                                                                                                                                                                                                                                 |

### Turn order (one card)

1. Card effects with modifiers: Ad-Fatigue (≥ 3 ads in the previous 4 plays: 50% revenue, 2× user loss), Echo-Chamber (viral streak ≥ 3: +50% users; +25 Toxicity once when the streak reaches 3). (Journalistieke Droogte is gone: balance-cleanup D1.)
2. Phase scaling: negative reputation × `reputationLossMultiplier`, positive revenue × `revenueGainMultiplier` (rounded half away from zero).
3. Every non-news card adds `newsIgnoredToxicity`.
4. Passive costs of the phase; reputation decay (−3 × `reputationLossMultiplier`) once `afterTurnsWithoutNews` turns passed without news.
5. Land the turn on the score (score-redesign D11, D20, D26): users gains × `usersPerPoint`, users losses take `userLossPerPoint` of the current users per point (floor 0); money gains × `moneyPerPoint` × the audience factor (users / `audienceUsers`, 0–1.5), costs × `moneyPerPoint`; reputation and Toxicity clamp to 0–100; Toxicity above `toxicityDrain.from` drains reputation (D21). Game over only when money is below € 0 (Bankroet, D16).
6. Both goal lines reached (users and money, D17): next phase (phase 4: IPO win). No streaks.
7. Event check under pacing (D10): at most one event per card turn, a due milestone first; otherwise, when pacing allows, a seeded roll against the scandal chance draws a scandal (D13, D22); otherwise a new draft.

Event options get phase scaling and land on the score like a card, plus the scandal fine (`finePoints` × `moneyPerPoint`) when the event is a scandal (D25), but no passive costs, decay or goal check (not a turn).

## Decisions

- **Users and money are the score (score-redesign D11, replaces game-engine D1):** `GameState.users` and `money` are absolute and canonical; the Inkomsten/Gebruikers meters, `stats`, `usersForMeter`, `meterForUsers` and gross omzet are gone. Authored effects stay in points and each phase sets what a point is worth. `TurnReport.delta` is the absolute change of the turn (board, feed, juice). `peakUsers` stays for the end screens, since users can fall. Reputation and Toxicity are hidden 0–100 values (D13, D21).
- **Goals (score-redesign D17, replaces D2):** two goal lines per phase, `goal.users` and `goal.money`; the phase ends on the card turn both are reached. Events never end a phase on their own.
- **Droogte removed (balance-cleanup D1, replaces D3):** Journalistieke Droogte (viral Toxicity 2× after 5 turns without news, plus the board's red frame and notice) is gone with `isJournalismDroughtActive`, `TurnModifiers.journalismDrought` and `BalanceConfig.journalismDrought`. Under the score model Toxicity already saturates for a viral-heavy player and reputation is hidden, so the doubling barely changed a run and its notice warned about a value players can't see. Reputation decay after `afterTurnsWithoutNews` turns stays (score-redesign D21; balance-cleanup D3): it is the live news-neglect rule that feeds the scandal chance.
- **Echo-Chamber (D4):** the +25 Toxicity fires once per streak, the +50% user bonus on every viral while the streak lasts.
- **Ad-Fatigue (D5):** checked against the previous 4 plays.
- **Events (D6, score-redesign D14, D22):** a milestone fires once, from its phase on. Scandals (`trigger: { kind: "scandal", phases }`) are drawn by the scandal chance: 0 at or above `scandal.threshold`, rising to `maxChance` over `rampPoints` reputation points below it. The draw picks a random unfired scandal of the phase, or the one fired longest ago once all have fired, so scandals keep coming while reputation stays low. No scandal before the first card turn. A scandal at the maximum chance is urgent for pacing.
- **Event pacing (D10, event-pacing lap):** events are surprises spread over the run, not bursts (player feedback: too many right after each other). Rules, with `BalanceConfig.eventPacing`: (1) at most one event opens per card turn, so resolving an event always returns to a draft; (2) a regular (Toxicity) event waits `minTurnsBetween` plus a seeded 0…`randomExtraTurns` card turns after the previous event, drawn from the run RNG when an event opens (`scheduleNextEvent`), and the first regular event waits `minTurnsBetween` from the start; (3) urgent events skip the random gap but still wait `urgentMinTurnsBetween` (≥ 1): milestones, and scandals at the maximum chance (score-redesign D22; replaces the `crisisToxicity` rule); (4) a milestone is due from its phase on and stays due until it fires (carried to a later phase if pacing held it back), so milestones stay reliable; (5) the scandal roll only uses RNG state when a scandal can open, so runs without scandal risk replay as before. Pacing state is `lastEventTurn` / `nextEventTurn` in `GameState`, so a seed plus the same actions replays the same events. Rejected: a queue of triggered event ids (the triggers already re-check every turn, so a queue would duplicate state); a separate RNG stream for gaps (one run RNG keeps one source of randomness, D-reproducible). The random draw shifts later hands, so saves moved to game-save v2.
- **Shuffled hand (shuffled-hand D1–D3; equal type odds balance-cleanup D2):** `drawHand` draws `HAND_SIZE` (3) different cards with the run RNG, without replacement: each slot first picks a type (viral, ad, news) with equal chance, then a card of that type from the phase's pool, so every type fills about 1/3 of the slots whatever the pool's mix. A hand can still hold any mix of types (three ads, two news and a viral, …) and the slot order is the draw order. A type with no undrawn card left in the phase drops out of that slot's pick (the others share it equally). Saves moved to game-save v5. `Hand` is that ordered id list. Replaces one card per type in a fixed order: players tapped the same slot on autopilot. Throws when a phase has fewer than 3 cards. Saves moved to game-save v3.
- **Game-over priority (D7):** Bankroet, then Verlaten Platform, then Verbod & Regulering.
- **Decay scales per phase (D9):** reputation decay is multiplied by the phase's `reputationLossMultiplier` like other reputation loss (design § 6).
- **Identifiers (D8):** code ids are English (`revenue`, `users`, `reputation`, `viral` / `ad` / `news`, `bankrupt` / `abandoned` / `banned`); all player text is Dutch and lives in content.

## Not modelled yet

Design lines the engine does not implement as separate rules (content events or a later lap can add them): phase 2 competitors taking users when engagement drops and complaints about ad pressure; phase 3 fines that follow directly from ignoring news (today only via Toxicity events and phase-scaled decay); the end report of damage done (the board lap can derive it from `playedTypes` and stats).

## Testing

TDD, colocated `services/*.test.ts` (Vitest). `gameEngine.test.ts` § acceptance covers reproducibility, the three game overs and the IPO win.

## Dependencies

- None outside this feature (no React, Supabase or kit imports).
