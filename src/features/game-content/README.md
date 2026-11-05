# Game content

The full Dutch deck and all player-facing copy for Clickbait Capital, as typed data. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`; the engine and its content schema live in `src/features/game-engine/`.

## Purpose

- Supplies `GAME_CONTENT`, a `GameContent` the engine plays: 71 cards (viral 24 and news 24: 8 for every phase plus 4 per phase; ads 23: 7 plus 4 per phase, so every draft picks from 11–12 per type), 16 events, the four phases and the balance constants.
- Adds presentation the engine does not need: flavor text and image hints (`imageTheme`, `imageAlt`) per card and event id, phase intros, the three game-over texts, the IPO end report, all UI copy (`UI_COPY`) and the glossary of hard words (`GLOSSARY`).
- Audience: pupils of about 11 (groep 7/8). Short sentences, everyday Dutch, situations from their world; hard words are marked and explained on tap (kids-content D1–D3).
- No UI, no React. Board and screen laps import `@/features/game-content/api`.

## Structure

| Layer    | Path                                                                 | Purpose                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API      | `api/index.ts`                                                       | Public barrel: `GAME_CONTENT`, `getContentCard`, `getContentEvent`, `PHASE_INTROS`, `GAME_OVER_TEXTS`, `selectGameOverText`, `buildEndReport`, `fillTemplate`, `UI_COPY`, `GLOSSARY`, types           |
| API      | `api/copy.ts`                                                        | Copy-only entry: `UI_COPY` without the deck, for app-shell code in the main chunk (app-status)                                                                                                        |
| Services | `services/viralCards.ts`, `adCards.ts`, `newsCards.ts`               | Card pool per type                                                                                                                                                                                    |
| Services | `services/eventCards.ts`                                             | Events with three options (A commercial, B engagement, C journalism)                                                                                                                                  |
| Services | `services/phases.ts`                                                 | `CONTENT_BALANCE`, `CONTENT_PHASES`, `PHASE_INTROS`                                                                                                                                                   |
| Services | `services/endings.ts`                                                | Game-over stories + `selectGameOverText`, IPO report, `buildEndReport`, `fillTemplate`                                                                                                                |
| Services | `services/uiCopy.ts`                                                 | `UI_COPY` grouped by screen (start, how to play, tutorial, meters, board, resume, events, results, settings, credits, privacy, errors, app status, empty states, loading); `GLOSSARY` (term → uitleg) |
| Services | `services/gameContent.ts`                                            | Assembles `GAME_CONTENT`; id lookups                                                                                                                                                                  |
| Tests    | `services/gameContent.test.ts`, `services/balanceSimulation.test.ts` | Integrity, end report, glossary (every marked term explained, every entry used, markup only in rich fields, no trademarks); seeded balance simulation through the real engine                         |
| Types    | `types/contentPresentation.types.ts`                                 | Presentation shapes (no engine imports, types stay runtime-free)                                                                                                                                      |

### Card profile (enforced by `gameContent.test.ts`)

| Type        | Always                            | Never                     |
| ----------- | --------------------------------- | ------------------------- |
| Viraal      | users +, Toxicity +               | revenue                   |
| Advertentie | revenue +, users −                | reputation gain           |
| Nieuws      | reputation +, Toxicity −, users − | revenue (€ 0, design § 4) |

### Events

The engine fires the first open event in `EVENT_CARDS` order, one per turn.

| Event                              | Trigger                   | Models                                  |
| ---------------------------------- | ------------------------- | --------------------------------------- |
| Gemeen filmpje over een klasgenoot | Toxicity > 18, phase 1    | first boomerang (bullying)              |
| Je eerste ophef                    | Toxicity > 25, phase 1    | first boomerang                         |
| Investeerders aan tafel            | milestone phase 2         | design § 6 Fase 2                       |
| Een andere app doet je na          | Toxicity > 15, phase 2    | competitors (engine "Not modelled yet") |
| Klachten over te veel reclame      | Toxicity > 35, phase 2    | ad-pressure complaints (idem)           |
| Een challenge wordt gevaarlijk     | Toxicity > 50, phases 2–3 | boomerang                               |
| Oplichters beloven gratis skins    | Toxicity > 55, phases 2–3 | scam ads                                |
| De wereld kijkt mee                | milestone phase 3         | design § 6 Fase 3                       |
| Streamers maken ruzie              | Toxicity > 35, phase 3    | boomerang                               |
| Een boete voor je app              | Toxicity > 45, phase 3    | fines (engine "Not modelled yet")       |
| Nepnieuws over de verkiezingen     | Toxicity > 60, phase 3    | design § 4 example (design options)     |
| Uitleggen in het parlement         | Toxicity > 70, phases 3–4 | hearings (idem)                         |
| Ouders en scholen slaan alarm      | Toxicity > 80, phases 3–4 | backlash (design § 6 Fase 3)            |
| Op weg naar de beurs               | milestone phase 4         | design § 6 Fase 4                       |
| De helft is nep                    | Toxicity > 40, phase 4    | boomerang (fake followers)              |
| Geheime papieren uitgelekt         | Toxicity > 65, phase 4    | boomerang                               |

## Decisions

- **Typed TS data, not JSON (game-content D1):** the structure whitelist has no data folder, and TS checks the deck against the engine schema at compile time, like `seedContent.ts`.
- **Presentation beside the schema (D2):** flavor and image hints are extra fields on the same objects (`ContentCard = CardDefinition & CardPresentation`); the engine ignores them, so its schema did not change. The imagery lap keys images by card and event id (`@/features/card-imagery/api` `getCardImage`); its alt text describes the real photo, so `imageAlt` stays a sourcing hint.
- **Intended losses (D3):** viral-only ends in Verbod & Regulering, ad-only in Verlaten Platform, news-heavy (news plus viral, never ads) in Bankroet. `balanceSimulation.test.ts` asserts all three.
- **"Not modelled yet" as events (D4):** competitors and ad-pressure complaints (phase 2), fines and hearings (phase 3) are Toxicity-triggered events. The engine cannot trigger on falling engagement, so the competitor event fires early in phase 2 for any player who ignored news (Toxicity > 15).
- **Content owns its balance (D5):** `CONTENT_BALANCE` and `CONTENT_PHASES` start from the engine's `SEED_CONTENT`; changed: server costs phase 3 −6 and phase 4 −7 revenue per turn (seed −5 / −6), and phase 1 `usersPerPoint` 2,000 (seed 5,000). With the seed costs a careful player won every simulated run in the minimum number of turns; with these, a naive rotation reaches the IPO phase but goes bankrupt there, and only reactive play wins. With 5,000 users per point phase 1 lasted two turns, so its nine cards per type and the first event never showed; 2,000 gives 4 turns for a pure viral rush and about 11 for balanced play. Superseded in part by D8.
- **Run length from play-tests (D8, balance-pass lap):** target a 25–45-turn run for a decent player who sees only the board. Phase 3 hold 30 → 12 turns (orchestrator decision for run length; design § 6 updated); phase 1 `usersPerPoint` 2,000 → 2,500 (balanced V/A/N leaves phase 1 in 19 instead of 25 turns; a viral rush still takes 4); phase 4 server cost −7 → −6 and reputation loss ×3 → ×2.5 (a shorter phase 3 leaves less buffer before the IPO; with −7 and ×3 a rule-of-thumb player stalled there; with −5 even the naive V/A/N rotation wins every game). The `humanLike` and `ruleOfThumb` strategies are the yardsticks (rule-of-thumb: 9 turns in phase 1, ~55 per run). `humanLike` is the same one-step lookahead as `mixed`, scored only on meters, stats, phase and goal streak. Instead of reading Toxicity, it plays news once four turns have passed without it. Known and not fixed in content: a 1-in-5 viral rotation (V/A/N/N/A) never leaves phase 1, because news and ads must cost users (card profile) and Inkomsten/Reputatie gains above 100 are lost; the fix is feedback on the board (show a capped gain), not more growth on news or ads. Its `usersPerPoint` values are superseded by D9.
- **Phase markets (D9, users-stat-model lap):** the users stat is read off the Gebruikers meter (engine D1), so each phase sets `usersAtFullMeter`, the market behind a full meter: 115k / 5.3M / 22.5M / 30M. That puts the users goals at Gebruikers 87 (100k), 95 (5M) and 89 (20M). Players enter phases 2–4 at Gebruikers 85–95 (simulation p10–p90), so a goal below ~90 would already hold on entry and phase 2 would hinge on the € 500k alone; 95 makes the phase 2 users goal real (met on entry in 13 of 60 human-like games, 3 of 60 rule-of-thumb). Phase 3 always starts with its goal holding, because phase 2 ends at Gebruikers ≥ 95, which is above 89; its challenge is keeping Gebruikers ≥ 89 for 12 turns while ads and news cost users. A 22M market (goal at 91) doubled the rule-of-thumb run in phase 3 (40 turns); 23M (goal at 87) made the hold free. `gameContent.test.ts` asserts every users goal stays below its market; the simulation reports `usersGoalMetOnEntry` per phase. Revenue values unchanged (engine D1: revenue stays accumulated). `UI_COPY.results.usersLabel` is "Hoogste bereik": the results screen and end report show the run's peak reach (game-board D11). Bereik starts at 57.500 (Gebruikers 50 in the 115k market) instead of 1.000; accepted, since the 100k goal keeps the "nobody knows you yet" scale.
- **UI copy as one constant (D6):** `UI_COPY` grouped by screen, placeholders `{name}` filled with `fillTemplate`. No i18n library: the vision fixes Dutch only. The tutorial line describes single-tap play ("tik erop om hem te plaatsen") to match the board (game-board D2). `results.reportButton` was added for the ending → results step of the game-flow screens. The share-card lap added the share status lines (`shareDoneStatus`, `shareSavedAndCopiedStatus`, `shareSavedStatus`, `shareFailedStatus`; `shareCopied` now ends in a full stop), `shareCardFooter` and `shareFileName`. `UI_COPY.credits` also holds the `/credits` page headings (`imagesHeading`, `imagesIntro`, `audioHeading`); the image credits themselves come from `@/features/card-imagery/api`. The game-settings lap added `howToPlay`, `appStatus`, the motion / colour-mode / wipe keys under `settings` and the start-screen links (`start.howToPlayButton` now reads "Hoe speel je?"). The local-save lap added `resume` (the `/spel` resume offer) and `board.resumedAnnouncement`, uses `start.continueButton` / `start.newGameButton`, removed the untrue `board.quitConfirm` and names the saved game in `privacy`.
- **Tone:** satirical and playful Dutch for 11-year-olds. No real people, brands, parties, games or platforms; describe them generically ("dat battle-royale-spel", "een brawler-game", "een streamer", "een fatbike"); invented names only (MoonCoin, De Theepot). News copy is deliberately calm (design § 5).
- **Kids content (kids-content D1–D7):** hard words are marked `[[woord]]` or `[[vorm|term]]` and explained in `GLOSSARY`; markup only in prose fields that render through the kit's `GlossaryText` (card body and flavor, event body, phase intro body and tip, game-over body and lesson, end report intro, how-to-play, tutorial, privacy, credits body), never in titles, labels or buttons; feed posts and announcements strip it. The deck was scored for 11-year-olds (relatable / lesson / age fit, table in the lap brief): 20 adult-world items removed, 40 added from the pupils' world (skins, lootboxes, streamers, memes, challenges, fatbikes, group chats). Effects of new cards mirror the removed ones per phase, so no retune was needed. Phase names are kept (design § 6); the intros explain _scale-up_ and _beursgang_. "Je eerste shitstorm" is "Je eerste ophef" (id kept).
- **Events show scaled numbers (for the board and endings laps):** option effects are raw content values; the engine scales them per phase (negative reputation ×0.5 / ×1 / ×2 / ×2.5, positive revenue ×0.5 in phase 1). A raw −8 reputation is −20 at the IPO, so the event UI must show the phase-scaled effect, not the content value.
- **End report numbers are satire (D7):** `buildEndReport` derives each line from the run (played types, users, revenue, turns, fired events) with fixed scale factors; they read as plausible, not as statistics.
- **Game-over text matches the run (D9; ending-texts D1–D2):** each game over in `GAME_OVER_TEXTS` has one title and 2–3 stories (`variants`); `selectGameOverText(reason, run)` picks one from the run's played card types and crisis events, so the ending does not blame ads the player never showed. Verlaten Platform: the type played most (`adOverload` / `viralBurnout` / `dullFeed`; ties go ads, then viral). Bankroet: under 25% ads → `noIncome`, else `costsOutgrew`. Verbod & Regulering: a viral share of 50%+ → `viralToxicity`; else 2+ crises → `crises`; else more ads than viral → `scamAds`; else `viralToxicity`. Crises are toxicity-triggered events; milestone events (investors, worldwide, roadshow) do not count. The thresholds are exported (`NO_INCOME_BELOW_AD_SHARE`, `TOXIC_FROM_VIRAL_SHARE`, `CRISES_FROM_EVENTS`). The selection lives here, next to the texts and `buildEndReport`, because it decides which copy fits; game-flow only renders it. Event choices are not in the run summary, so no story claims which option the player picked.

## Balance simulation

`balanceSimulation.test.ts` plays 60 seeds per strategy through the real engine and prints a JSON summary (`pnpm vitest run src/features/game-content --silent=false`). Results at the time of writing:

| Strategy                                  | Ending (60 seeds)                        | Furthest phase | Median turns (p10–p90) | Median turns per phase (1/2/3/4) | Users goal met on entry (phase 2 / 3) |
| ----------------------------------------- | ---------------------------------------- | -------------- | ---------------------- | -------------------------------- | ------------------------------------- |
| Viral-only (events: B)                    | 60 × Verbod & Regulering                 | 2              | 8 (7–10)               | 3 / 5 / – / –                    | 38 / –                                |
| Ad-only (events: A)                       | 60 × Verlaten Platform                   | 1              | 12 (10–13)             | 12 / – / – / –                   | –                                     |
| News-heavy, no ads (events: C)            | 60 × Bankroet                            | 1              | 50 (50–50)             | 50 / – / – / –                   | –                                     |
| Rotate V/A/N (events: C)                  | 53 × Bankroet, 6 unfinished, 1 × won     | 4              | 127 (88–364)           | 19 / 7 / 12 / 93                 | 1 / 60                                |
| Rotate V/A/N/N/A (events: C)              | 44 unfinished (400 steps), 16 × Verlaten | 1              | –                      | stuck in 1                       | –                                     |
| Human-like, visible info only             | 60 × IPO won                             | 4              | 34 (32–38)             | 3 / 8 / 12 / 10                  | 24 / 60                               |
| Rule-of-thumb, visible info, no lookahead | 60 × IPO won                             | 4              | 53 (44–89)             | 9 / 7 / 13 / 23                  | 10 / 60                               |
| Mixed, one-step lookahead (sees Toxicity) | 60 × IPO won                             | 4              | 40 (33–42)             | 12 / 6 / 12 / 10                 | 5 / 60                                |

Before the kids-content lap (54 cards, 13 events): viral-only 11 turns (3 / 8); human-like 34 (31–42; 3 / 7 / 12 / 10), phase 2 users goal met on entry 13 of 60; rule-of-thumb 56 (46–83; 6 / 7 / 13 / 25), 3 of 60; mixed 40; rotate V/A/N 142, 55 × Bankroet; V/A/N/N/A 54 unfinished, 6 × Verlaten. Same winners and losers; viral-only gets banned sooner because the phase 2 viral pool now bites harder, and more human-like players already meet the phase 2 users goal on entry (24 of 60), so phase 2 hinges more often on the € 500k alone. Accepted: the run length stays inside 25–45 turns.

Before the users-stat-model lap (users accumulated per meter point): human-like 44 turns (35–60; 4 / 7 / 13 / 21); rule-of-thumb 55 (47–63; 9 / 7 / 15 / 22); mixed 47 (40–59; 4 / 7 / 14 / 20); rotate V/A/N 123, 59 × Bankroet; viral-only, ad-only and news-heavy as now. Human-like runs are shorter now mostly in the IPO phase (21 → 10): its lookahead scores `log10(users)`, which no longer rewards piling up users, so it plays for the IPO meters sooner.

Before the balance-pass lap (phase 3 hold 30, phase 1 2,000 users/point, phase 4 −7 and ×3): human-like 60 turns (4 / 8 / 31 / 17); rule-of-thumb won 12 of 60, most others stuck in the IPO phase (median 335 turns there); mixed 63 (11 / 6 / 32 / 12); rotate V/A/N 91, bankrupt.

Every event fires in some simulated game (asserted); the JSON output lists how often per strategy.

`mixed` sees hidden Toxicity, which a human does not; treat its win rate as an upper bound. `humanLike` sees only what the board shows (card and event effects, meters, stats, phase, goal streak); `ruleOfThumb` uses no lookahead, only rules a player reads off the board (rescue a meter under 35, news after three turns without it, avoid a third ad in four, push Inkomsten past 90 and Reputatie past 75 at the IPO). The lookahead players and play better than a first-time player; the rotations show how naive play fails. Rerun the simulation after any change to effects, events, phases or balance.

## Dependencies

- `@/features/game-engine/api` (types; engine functions in tests only).
- No React, Supabase or kit imports.
