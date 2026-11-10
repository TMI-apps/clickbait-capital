# Development plan: Score redesign (users + money as the score, reputation as a guard rail)

## Summary

- **Goal:** make the score impossible to miss: two big numbers (Gebruikers, Geld) that move gradually with a visible trend, phase goals as thresholds on those same two numbers, one end score, and reputation that is silent until it is in danger.
- **Why:** owner — "the relation between the three bars and the score is really hard to see"; direction: profit and users are targets that grow/shrink gradually, reputation only matters in the danger zone, the game should lure realistic platform choices.
- **Brief:** `BRIEF.md`
- **Size:** M overall, cut into laps L0 (this: design + mockup) and L1–L4 below (skill-loop D44).
- **Acceptance test (L0):** `src/features/score-mockup/services/scoreMockupModel.test.ts` (momentum model: gradual moves, forecast, danger zone in the scripted demo) + Playwright screenshot/fit script on the preview (manual, visual).
- **Plan review:** done in this lap (single-agent lenses below; L1 gets its own plan + review).

## Phase overview (L0)

| Phase | Goal                                     | Gate                                                                        | Status  |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------- | ------- |
| 1     | Brief, decisions, plan, precedent        | docs written                                                                | Done    |
| 2     | Fake momentum model + test               | model test green                                                            | Pending |
| 3     | Three HUD variants on `/mockup/score`    | type-check, lint, arch, structure, tests; no scroll at 390×844 and 1440×900 | Done |
| 4     | Screenshots + report to the orchestrator | screenshots read                                                            | Pending |

## Current system (verified in code)

- Three meters 0–100, start 50, game over at 0 (`game-engine/services/progression.ts` `getGameOver`).
- Users stat = Gebruikers meter × `phase.usersAtFullMeter` (`usersForMeter`), so the "score" is just the bar rescaled per phase; the number jumps when the phase changes.
- Omzet = gross, only positive revenue deltas × `revenuePerPoint` (`addGrossRevenue`), never falls, so it is not a score you protect.
- Phase goals differ in kind (`game-content/services/phases.ts` `CONTENT_PHASES`): 1 users; 2 users + omzet; 3 hold 20 mln users 12 turns; 4 reputation > 60 and Inkomsten-meter > 80 for 8 turns.
- Board: `MeterPanel` (three bars, big 0–100 numbers) is the loudest element; `PhaseProgress` shows the real score (goal stats) in `text-xs`. That inversion is the owner's problem.

## Proposed model (L1)

Per turn, after the card:

```
groei      = basisGroei(fase) + momentum − (gevaar ? 10% : 0)          // % per beurt
gebruikers = gebruikers × (1 + groei)                                   // gradual, compounding
opbrengst  = basisOpbrengst(fase) × (1 + advertentiedruk) × (gevaar ? 0.5 : 1)   // € per gebruiker per beurt
winst      = gebruikers × opbrengst − kosten(fase, gebruikers)          // can be negative
geld       = geld + winst
momentum   ×= 0.55 ; advertentiedruk ×= 0.6                              // card impulses fade over ~3 turns
```

| Card          | Trend change                                                                     | Hidden / slow                                                       |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Viraal        | momentum +12–16% (burst)                                                         | toxicity ↑ → reputation − later (boomerang as today)                |
| Advertentie   | advertentiedruk +1 (≈ double € per user for ~3 turns), momentum −3% (irritation) | ad fatigue: 3 ads in 4 turns → druk counts half, irritation doubles |
| Nieuws        | momentum −1%, reputation +, toxicity −                                           | —                                                                   |
| Event options | same three kinds, bigger                                                         | —                                                                   |

Lesson the model teaches: ads print money but slow growth; viral grows fastest but builds hidden toxicity; news is the only brake on the boomerang and costs growth. The danger zone hits **both** numbers (exodus + advertisers leave), so ethics returns as a business cost, which is the realistic platform logic the owner asked for.

## Full impact

| Area                      | Change                                                                                                                                                                                                         | Lap                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| game-engine types         | `GameState`: `users`, `money`, `momentum`, `adPressure` replace `meters.revenue/users` + `stats` + `peakUsers`; reputation stays a 0–100 meter; `FullEffects` → `{ growth, adPressure, reputation, toxicity }` | L1                   |
| game-engine services      | `turnEffects` (modifiers act on trend), `progression` (`usersForMeter`, `meterForUsers`, `addGrossRevenue` removed; goals read users/money; new game-over triggers D6)                                         | L1                   |
| game-content cards/events | every card's `effects` re-expressed as trend impulses (~90 cards + events): mechanical mapping table + hand tuning                                                                                             | L1                   |
| balance simulation        | `balanceSimulation.test.ts` strategies re-asserted: viral-only → Verbod, ad-only → Verlaten/slow, news-heavy → Bankroet/too slow, balanced → IPO in ~40–50 turns                                               | L1                   |
| game-save                 | `SAVE_VERSION` bump; old saves discarded with the existing "version mismatch → new run" path                                                                                                                   | L1                   |
| phases                    | goals = users + money thresholds (D4), phase intro tips rewritten                                                                                                                                              | L1 (data), L3 (copy) |
| game-board                | `MeterPanel` → `ScoreHud` (variant from D2), `PhaseProgress` shrinks to phase name + goal flags on the tickers; `boardView` maps new state; cards show trend arrows (D8); forecast on select/drag (D9)         | L2                   |
| game-juice                | count-up for big numbers (compact Dutch format), sparkline append, danger shake/vignette; `MeterJuice` accents retargeted                                                                                      | L2                   |
| screen reader             | one live summary per turn: "Gebruikers 2,4 miljoen, groei plus 8 procent. Geld …"; reputation announced only on entering/leaving the danger zone; `role="meter"` stays for reputation only                     | L2                   |
| result-share              | end score (D5) on result screen + share card layout (`shareCardLayout`)                                                                                                                                        | L3                   |
| content copy              | `UI_COPY` meters/goal labels, glossary terms (groei, winst, bedrijfswaarde), how-to-play page, end report                                                                                                      | L3                   |
| docs                      | `DOC_GAME_DESIGN.md` § 2, 6, 7 rewritten; feature READMEs                                                                                                                                                      | L1–L3                |
| cleanup                   | delete `score-mockup` feature, page and route                                                                                                                                                                  | L4 (or end of L2)    |

## Follow-up laps (backlog after this one)

1. **L1 — Momentum engine + balance (M):** engine state/effects, progression, card+event effect migration, balance simulation, save bump, DOC_GAME_DESIGN. Board temporarily maps the new state onto the old panel (two numbers in the meter tiles) so `/spel` keeps working.
2. **L2 — Score HUD + juice + forecast (M):** the chosen variant in `game-board`, trend arrows on cards, forecast on select/drag, danger-zone juice, screen reader, a11y; mobile fit at 360×640 / 390×844 and desk. Deletes the mockup.
3. **L3 — Phases, result and share (S):** goal copy, phase intros, end score on result + share card, how-to-play, glossary.
4. **L4 — Tuning pass after owner play-test (S).**

## Conflict & compliance

- Applicable rules: architecture (placement, layers, feature granularity), file-placement, code-style § Naming, testing, git-workflow (Model C).
- File placements (L0): `src/features/score-mockup/{README.md,services/scoreMockupModel.ts(+test),hooks/,components/}`, `src/pages/ScoreMockupPage.tsx`, route in `src/App.tsx`. Validated with `pnpm validate:structure`.
- Reuse / packages: no chart library — plain SVG sparklines (a 20-point polyline needs none); number tween via `requestAnimationFrame` (game-juice `CountUpNumber` has no formatter and is a feature internal for the real board). Skipped `spec-reuse-package`: no generic subsystem.
- Foundation cleanup: L1/L2 delete `usersForMeter`/`meterForUsers`/`addGrossRevenue` and the meter vocabulary second copy (`MeterPanel` METERS vs kit `GAME_CARD_METERS`) once two meters disappear.
- Risks: (1) ~90 cards re-expressed; mitigated by a mapping function + simulation. (2) Big compounding numbers can run away; cap growth per turn (−15%…+25%) and use phase market caps (logistic: groei × (1 − gebruikers/markt)). (3) Kids must still feel the boomerang: keep it delayed and loud.
- Standards diversions: none in L0.

## Review contract

- **Rules pinned:** `rules@af789e7` — architecture, file-placement, code-style, testing, agent-behavior, git-workflow
- **Required lenses:** Pattern & precedent (below), Reuse (plain SVG, no package), Feature decomposition (mockup is its own throwaway feature; real HUD stays in game-board), Naming (`score-mockup` names the throwaway by role; real mechanism in L2 = `ScoreHud`, `TrendTicker`, `DangerGuard`, not variant letters)
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** DECISIONS.md D1, D3, D6, D7, D9; open D2, D4, D5, D8 (owner)

### Amendments

| #   | Date | Source | Change | Applied to |
| --- | ---- | ------ | ------ | ---------- |

## Pattern & precedent

| Field                        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability**               | A score the player sees move with every choice, built from two growing quantities plus a hidden risk that turns loud near failure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Precedents**               | Stock tickers / Robinhood (big number, % change, sparkline); Balatro (score = chips × mult, the breakdown animates per card); Game Dev Story / Kairosoft (fans + money as the only two numbers, both always growing); Reigns (four bars, but the player only fears the extremes; hint dots preview impact); GTA wanted level (risk invisible until it is not, then it dominates the screen); idle games (rate per second next to the total)                                                                                                                                                                          |
| **Aspects reviewed**         | Salience of the score; causality (does a choice visibly move it); preview before commit; risk communication; end-of-run summary; readability for 11-year-olds                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Findings**                 | Salience: current design inverts it (bars loud, score tiny) — all precedents put the score biggest. Causality: momentum + rate ("+8%/beurt") is how tickers and idle games show cause; aligns. Preview: Balatro/Reigns preview impact before commit; aligns (D9), but the delayed cost must stay hidden (Reigns hides magnitude too). Risk: GTA/"danger music" pattern — silent until threshold; aligns with D3. End summary: one number (Balatro final score, Kairosoft ranking) shares best; aligns with D5. Kids: two numbers is the Kairosoft ceiling; a product formula (B) is harder to read than two tickers. |
| **Verdict**                  | Aligns with precedent (variant A/C); B is product-specific (Balatro-like breakdown) and riskier for 11-year-olds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **If non-standard: options** | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Pattern review: aligned.

## Notes during development

- Components may not import services (ESLint `no-restricted-imports`), so the mockup derives everything in `services/scoreHudView.ts` and the hook formats tweened numbers (`useTweenedText`). L2 follows the same split (`boardView` builds a `ScoreHudView`).
- Playwright at 390×844 and 1440×900, all three variants, preview + demo-in-danger: document scroll 0 (scrollHeight = innerHeight, scrollWidth = innerWidth), no page errors.
- Observed in the screenshots: a phone fits two tickers + the guard above a 5-post feed and the hand; the money preview (+€/beurt) reads well next to the trend, the chart (C) is empty at turn 1 and only tells a story after ~4 turns.

## Decisions made

| #   | Topic | Choice | Precedent? |
| --- | ----- | ------ | ---------- |
