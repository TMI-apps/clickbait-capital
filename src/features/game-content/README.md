# Game content

The full Dutch deck and all player-facing copy for Clickbait Capital, as typed data. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`; the engine and its content schema live in `src/features/game-engine/`.

## Purpose

- Supplies `GAME_CONTENT`, a `GameContent` the engine plays: 54 cards (18 per type: 6 for every phase plus 3 per phase, so every draft picks from 9 per type), 13 events, the four phases and the balance constants.
- Adds presentation the engine does not need: flavor text and image hints (`imageTheme`, `imageAlt`) per card and event id, phase intros, the three game-over texts, the IPO end report and all UI copy (`UI_COPY`).
- No UI, no React. Board and screen laps import `@/features/game-content/api`.

## Structure

| Layer    | Path                                                                 | Purpose                                                                                                                                                   |
| -------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`                                                       | Public barrel: `GAME_CONTENT`, `getContentCard`, `getContentEvent`, `PHASE_INTROS`, `GAME_OVER_TEXTS`, `buildEndReport`, `fillTemplate`, `UI_COPY`, types |
| Services | `services/viralCards.ts`, `adCards.ts`, `newsCards.ts`               | Card pool per type                                                                                                                                        |
| Services | `services/eventCards.ts`                                             | Events with three options (A commercial, B engagement, C journalism)                                                                                      |
| Services | `services/phases.ts`                                                 | `CONTENT_BALANCE`, `CONTENT_PHASES`, `PHASE_INTROS`                                                                                                       |
| Services | `services/endings.ts`                                                | Game-over texts, IPO report template, `buildEndReport`, `fillTemplate`                                                                                    |
| Services | `services/uiCopy.ts`                                                 | `UI_COPY` grouped by screen (start, tutorial, meters, board, events, results, settings, credits, errors, empty states, loading)                           |
| Services | `services/gameContent.ts`                                            | Assembles `GAME_CONTENT`; id lookups                                                                                                                      |
| Tests    | `services/gameContent.test.ts`, `services/balanceSimulation.test.ts` | Integrity and end report; seeded balance simulation through the real engine                                                                               |
| Types    | `types/contentPresentation.types.ts`                                 | Presentation shapes (no engine imports, types stay runtime-free)                                                                                          |

### Card profile (enforced by `gameContent.test.ts`)

| Type        | Always                            | Never                     |
| ----------- | --------------------------------- | ------------------------- |
| Viraal      | users +, Toxicity +               | revenue                   |
| Advertentie | revenue +, users −                | reputation gain           |
| Nieuws      | reputation +, Toxicity −, users − | revenue (€ 0, design § 4) |

### Events

| Event                          | Trigger                   | Models                                  |
| ------------------------------ | ------------------------- | --------------------------------------- |
| Je eerste shitstorm            | Toxicity > 25, phase 1    | first boomerang                         |
| Investeerders aan tafel        | milestone phase 2         | design § 6 Fase 2                       |
| Een concurrent kopieert je app | Toxicity > 15, phase 2    | competitors (engine "Not modelled yet") |
| Klachten over reclamedruk      | Toxicity > 35, phase 2    | ad-pressure complaints (idem)           |
| Moderatoren slaan alarm        | Toxicity > 55, phases 2–3 | boomerang                               |
| De wereld kijkt mee            | milestone phase 3         | design § 6 Fase 3                       |
| Boete van de toezichthouder    | Toxicity > 45, phase 3    | fines (idem)                            |
| Verkiezingen & Desinformatie   | Toxicity > 60, phase 3    | design § 4 example (design options)     |
| Parlementaire hoorzitting      | Toxicity > 70, phases 3–4 | hearings (idem)                         |
| Adverteerders boycotten je     | Toxicity > 80, phases 3–4 | ad boycott (design § 6 Fase 3)          |
| Roadshow voor de beurs         | milestone phase 4         | design § 6 Fase 4                       |
| Rapport van een shortseller    | Toxicity > 40, phase 4    | boomerang                               |
| Gelekte documenten             | Toxicity > 65, phase 4    | boomerang                               |

## Decisions

- **Typed TS data, not JSON (game-content D1):** the structure whitelist has no data folder, and TS checks the deck against the engine schema at compile time, like `seedContent.ts`.
- **Presentation beside the schema (D2):** flavor and image hints are extra fields on the same objects (`ContentCard = CardDefinition & CardPresentation`); the engine ignores them, so its schema did not change. The imagery lap keys images by card and event id.
- **Intended losses (D3):** viral-only ends in Verbod & Regulering, ad-only in Verlaten Platform, news-heavy (news plus viral, never ads) in Bankroet. `balanceSimulation.test.ts` asserts all three.
- **"Not modelled yet" as events (D4):** competitors and ad-pressure complaints (phase 2), fines and hearings (phase 3) are Toxicity-triggered events. The engine cannot trigger on falling engagement, so the competitor event fires early in phase 2 for any player who ignored news (Toxicity > 15).
- **Content owns its balance (D5):** `CONTENT_BALANCE` and `CONTENT_PHASES` start from the engine's `SEED_CONTENT`; changed: server costs phase 3 −6 and phase 4 −7 revenue per turn (seed −5 / −6), and phase 1 `usersPerPoint` 2,000 (seed 5,000). With the seed costs a careful player won every simulated run in the minimum number of turns; with these, a naive rotation reaches the IPO phase but goes bankrupt there, and only reactive play wins. With 5,000 users per point phase 1 lasted two turns, so its nine cards per type and the first event never showed; 2,000 gives 4 turns for a pure viral rush and about 11 for balanced play. The phase 3 30-turn hold stays (design SSOT); it is half of a run and is left to a later balance lap.
- **UI copy as one constant (D6):** `UI_COPY` grouped by screen, placeholders `{name}` filled with `fillTemplate`. No i18n library: the vision fixes Dutch only. The tutorial line describes single-tap play ("tik erop om hem te plaatsen") to match the board (game-board D2). `results.reportButton` was added for the ending → results step of the game-flow screens.
- **Tone:** satirical, sharp, playful Dutch. No real people, brands, parties or platforms; invented names only (MoonCoin, NachtUil, De Theepot). News copy is deliberately dry (design § 5).
- **Events show scaled numbers (for the board and endings laps):** option effects are raw content values; the engine scales them per phase (negative reputation ×0.5 / ×1 / ×2 / ×3, positive revenue ×0.5 in phase 1). A raw −8 reputation is −24 at the IPO, so the event UI must show the phase-scaled effect, not the content value.
- **End report numbers are satire (D7):** `buildEndReport` derives each line from the run (played types, users, revenue, turns, fired events) with fixed scale factors; they read as plausible, not as statistics.

## Balance simulation

`balanceSimulation.test.ts` plays 60 seeds per strategy through the real engine and prints a JSON summary (`pnpm vitest run src/features/game-content --silent=false`). Results at the time of writing:

| Strategy                       | Ending (60 seeds)        | Furthest phase | Median turns | Median turns per phase (1/2/3/4) |
| ------------------------------ | ------------------------ | -------------- | ------------ | -------------------------------- |
| Viral-only (events: B)         | 60 × Verbod & Regulering | 2              | 10           | 4 / 6 / – / –                    |
| Ad-only (events: A)            | 60 × Verlaten Platform   | 1              | 12           | 12 / – / – / –                   |
| News-heavy, no ads (events: C) | 60 × Bankroet            | 1              | 50           | 50 / – / – / –                   |
| Rotate V/A/N (events: C)       | 60 × Bankroet            | 4              | 91           | 25 / 9 / 44 / 13                 |
| Mixed, one-step lookahead      | 60 × IPO won             | 4              | 63           | 11 / 6 / 32 / 12                 |

Every event fires in some simulated game (asserted); the JSON output lists how often per strategy.

The lookahead player sees hidden Toxicity and exact effects, which a human does not; treat its win rate as an upper bound. Rerun the simulation after any change to effects, events, phases or balance.

## Dependencies

- `@/features/game-engine/api` (types; engine functions in tests only).
- No React, Supabase or kit imports.
