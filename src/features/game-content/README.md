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
| API      | `api/copy.ts`                                                        | Copy-only entry: `UI_COPY` without the deck, for app-shell code in the main chunk (app-status) |
| Services | `services/viralCards.ts`, `adCards.ts`, `newsCards.ts`               | Card pool per type                                                                                                                                        |
| Services | `services/eventCards.ts`                                             | Events with three options (A commercial, B engagement, C journalism)                                                                                      |
| Services | `services/phases.ts`                                                 | `CONTENT_BALANCE`, `CONTENT_PHASES`, `PHASE_INTROS`                                                                                                       |
| Services | `services/endings.ts`                                                | Game-over texts, IPO report template, `buildEndReport`, `fillTemplate`                                                                                    |
| Services | `services/uiCopy.ts`                                                 | `UI_COPY` grouped by screen (start, how to play, tutorial, meters, board, events, results, settings, credits, errors, app status, empty states, loading)                           |
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
- **Presentation beside the schema (D2):** flavor and image hints are extra fields on the same objects (`ContentCard = CardDefinition & CardPresentation`); the engine ignores them, so its schema did not change. The imagery lap keys images by card and event id (`@/features/card-imagery/api` `getCardImage`); its alt text describes the real photo, so `imageAlt` stays a sourcing hint.
- **Intended losses (D3):** viral-only ends in Verbod & Regulering, ad-only in Verlaten Platform, news-heavy (news plus viral, never ads) in Bankroet. `balanceSimulation.test.ts` asserts all three.
- **"Not modelled yet" as events (D4):** competitors and ad-pressure complaints (phase 2), fines and hearings (phase 3) are Toxicity-triggered events. The engine cannot trigger on falling engagement, so the competitor event fires early in phase 2 for any player who ignored news (Toxicity > 15).
- **Content owns its balance (D5):** `CONTENT_BALANCE` and `CONTENT_PHASES` start from the engine's `SEED_CONTENT`; changed: server costs phase 3 −6 and phase 4 −7 revenue per turn (seed −5 / −6), and phase 1 `usersPerPoint` 2,000 (seed 5,000). With the seed costs a careful player won every simulated run in the minimum number of turns; with these, a naive rotation reaches the IPO phase but goes bankrupt there, and only reactive play wins. With 5,000 users per point phase 1 lasted two turns, so its nine cards per type and the first event never showed; 2,000 gives 4 turns for a pure viral rush and about 11 for balanced play. Superseded in part by D8.
- **Run length from play-tests (D8, balance-pass lap):** target a 25–45-turn run for a decent player who sees only the board. Phase 3 hold 30 → 12 turns (orchestrator decision for run length; design § 6 updated); phase 1 `usersPerPoint` 2,000 → 2,500 (balanced V/A/N leaves phase 1 in 19 instead of 25 turns; a viral rush still takes 4); phase 4 server cost −7 → −6 and reputation loss ×3 → ×2.5 (a shorter phase 3 leaves less buffer before the IPO; with −7 and ×3 a rule-of-thumb player stalled there; with −5 even the naive V/A/N rotation wins every game). The `humanLike` and `ruleOfThumb` strategies are the yardsticks (rule-of-thumb: 9 turns in phase 1, ~55 per run). `humanLike` is the same one-step lookahead as `mixed`, scored only on meters, stats, phase and goal streak. Instead of reading Toxicity, it plays news once four turns have passed without it. Known and not fixed in content: a 1-in-5 viral rotation (V/A/N/N/A) never leaves phase 1, because news and ads must cost users (card profile) and Inkomsten/Reputatie gains above 100 are lost; the fix is feedback on the board (show a capped gain), not more growth on news or ads. `stats.users` can still fall to 0 while the Gebruikers meter is mid-range (engine D1 stat model); a meter-derived stat is an engine change, proposed as its own task.
- **UI copy as one constant (D6):** `UI_COPY` grouped by screen, placeholders `{name}` filled with `fillTemplate`. No i18n library: the vision fixes Dutch only. The tutorial line describes single-tap play ("tik erop om hem te plaatsen") to match the board (game-board D2). `results.reportButton` was added for the ending → results step of the game-flow screens. `UI_COPY.credits` also holds the `/credits` page headings (`imagesHeading`, `imagesIntro`, `audioHeading`); the image credits themselves come from `@/features/card-imagery/api`. The game-settings lap added `howToPlay`, `appStatus`, the motion / colour-mode / wipe keys under `settings` and the start-screen links (`start.howToPlayButton` now reads "Hoe speel je?").
- **Tone:** satirical, sharp, playful Dutch. No real people, brands, parties or platforms; invented names only (MoonCoin, NachtUil, De Theepot). News copy is deliberately dry (design § 5).
- **Events show scaled numbers (for the board and endings laps):** option effects are raw content values; the engine scales them per phase (negative reputation ×0.5 / ×1 / ×2 / ×2.5, positive revenue ×0.5 in phase 1). A raw −8 reputation is −20 at the IPO, so the event UI must show the phase-scaled effect, not the content value.
- **End report numbers are satire (D7):** `buildEndReport` derives each line from the run (played types, users, revenue, turns, fired events) with fixed scale factors; they read as plausible, not as statistics.

## Balance simulation

`balanceSimulation.test.ts` plays 60 seeds per strategy through the real engine and prints a JSON summary (`pnpm vitest run src/features/game-content --silent=false`). Results at the time of writing:

| Strategy                                  | Ending (60 seeds)                       | Furthest phase | Median turns (p10–p90) | Median turns per phase (1/2/3/4) |
| ----------------------------------------- | --------------------------------------- | -------------- | ---------------------- | -------------------------------- |
| Viral-only (events: B)                    | 60 × Verbod & Regulering                | 2              | 11 (9–11)              | 4 / 7 / – / –                    |
| Ad-only (events: A)                       | 60 × Verlaten Platform                  | 1              | 12 (10–14)             | 12 / – / – / –                   |
| News-heavy, no ads (events: C)            | 60 × Bankroet                           | 1              | 50 (50–50)             | 50 / – / – / –                   |
| Rotate V/A/N (events: C)                  | 59 × Bankroet, 1 unfinished             | 4              | 123 (91–277)           | 19 / 9 / 23 / 69                 |
| Rotate V/A/N/N/A (events: C)              | 52 unfinished (400 steps), 8 × Verlaten | 1–3            | –                      | stuck in 1                       |
| Human-like, visible info only             | 60 × IPO won                            | 4              | 44 (35–60)             | 4 / 7 / 13 / 21                  |
| Rule-of-thumb, visible info, no lookahead | 60 × IPO won                            | 4              | 55 (47–63)             | 9 / 7 / 15 / 22                  |
| Mixed, one-step lookahead (sees Toxicity) | 60 × IPO won                            | 4              | 47 (40–59)             | 4 / 7 / 14 / 20                  |

Before the balance-pass lap (phase 3 hold 30, phase 1 2,000 users/point, phase 4 −7 and ×3): human-like 60 turns (4 / 8 / 31 / 17); rule-of-thumb won 12 of 60, most others stuck in the IPO phase (median 335 turns there); mixed 63 (11 / 6 / 32 / 12); rotate V/A/N 91, bankrupt.

Every event fires in some simulated game (asserted); the JSON output lists how often per strategy.

`mixed` sees hidden Toxicity, which a human does not; treat its win rate as an upper bound. `humanLike` sees only what the board shows (card and event effects, meters, stats, phase, goal streak); `ruleOfThumb` uses no lookahead, only rules a player reads off the board (rescue a meter under 35, news after three turns without it, avoid a third ad in four, push Inkomsten past 90 and Reputatie past 75 at the IPO). The lookahead players and play better than a first-time player; the rotations show how naive play fails. Rerun the simulation after any change to effects, events, phases or balance.

## Dependencies

- `@/features/game-engine/api` (types; engine functions in tests only).
- No React, Supabase or kit imports.
