# Brief — Game-over texts that match the run

Task: orchestrator request after a production play-test (not in app-tasks.json) · Lap: temp_job_ending-texts · Harness: v0.44.0

## Problem

Each game over has one fixed text, so a news-only run that ends in "Verlaten Platform" reads "Reclame na reclame na reclame…" although the player showed no ads; the ending lies about the run and the lesson misses.

## Success check

For each game over, `selectGameOverText(reason, run)` returns the variant that matches how the run got there (e.g. Verlaten after a news-only run → the dull-feed text, not the ad text), and the game-flow ending screen shows it; the three endings show their run-specific text on the preview.

## In scope

- game-content `endings.ts`: per game over 2–3 Dutch variants (headline, body, lesson; title shared) and a pure `selectGameOverText(reason, run)`:
  - Verlaten Platform: ad overload / dull news feed / viral burnout — by the dominant played type.
  - Bankroet: no income (few ads) / costs outgrew income.
  - Verbod & Regulering: viral toxicity / crises piled up / scam ads.
- game-flow `toEndingView` renders the selected variant; results title unchanged.
- Remove the landed lap folders `documentation/jobs/temp_job_game-settings` and `temp_job_juice-motion-setting` (their decision-log sections exist).

## Out of scope

- Will NOT do: track event choices in the engine (the run summary has fired events, not choices); new report lines.
- Will NOT touch: engine, board, `app-tasks.json`, IPO ending.

## Edges

| Feature area | Loop today                                     | Hook point                                   | Ride / new |
| ------------ | ---------------------------------------------- | -------------------------------------------- | ---------- |
| game-content | `GAME_OVER_TEXTS[reason]` one text each        | `services/endings.ts`, types, api, README    | ride       |
| game-flow    | `toEndingView` reads `GAME_OVER_TEXTS[reason]` | `services/endFlow.ts`, test, README          | ride       |
| docs         | lap folders after landing                      | `documentation/jobs/`, `DOC_DECISION_LOG.md` | ride       |

## Size

S — one content module (data + one pure selector), one flow mapper, tests, docs.

## Plan

1. Acceptance tests first, in `src/features/game-content/services/gameContent.test.ts` (game-content's services layer is at its 10-file budget): each reason's variants picked from playedTypes / firedEventIds, including the orchestrator's case (news-only → Verlaten dull feed); every variant has non-empty Dutch headline/body/lesson. `endFlow.test.ts`: the ending view shows the selected variant.
2. Data shape: `GAME_OVER_TEXTS[reason] = { title, variants: { <id>: { headline, body, lesson } } }`; the old single text becomes one variant per reason (ad overload, no income, viral toxicity).
3. Selector `selectGameOverText(reason, run)` → `{ title, variant, headline, body, lesson }`; shares of played types decide, events count for Verbod.
4. game-flow `toEndingView` calls it; results keep `GAME_OVER_TEXTS[reason].title`.
5. Docs: game-content README (D-row), game-flow README dependency, `DOC_DECISION_LOG.md` § ending-texts.
6. Gate: CI steps locally; Playwright on the preview reaching all three game overs (scripted strategies) and reading the ending text.

## Decisions

`documentation/DOC_DECISION_LOG.md` § ending-texts.
