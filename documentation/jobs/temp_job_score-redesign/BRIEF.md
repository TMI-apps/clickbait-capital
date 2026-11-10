# Brief — Score redesign: Gebruikers and Geld as two lines, scandals as a visible risk

Task: owner request via orchestrator (score redesign) · Lap: temp_job_score-redesign · Harness: v0.45.0

Lap 0 (design + mockups, PR #50) is done. This brief covers the real build after the owner decision of 2026-11-10 (DECISIONS D10–D15). The momentum model and variants A and B are superseded.

## Problem

Players cannot see how the three 0–100 bars (Inkomsten, Gebruikers, Reputatie) relate to their score. The real score (users stat, gross omzet, phase goals of different kinds) sits small in the phase header, so a card play has no visible impact on how well they are doing.

## Owner decision (recorded, not re-asked)

"I want to stay closer to the existing design, but use the lines from C: Gebruikers and Geld. Keep everything else we have now, including the feed. Only the effects of posts go straight onto those two lines, as in example C. The predicted values should appear while you hold a card. Scandals should use the existing events with 3 options. The warning that a scandal is coming must be visible: a per-turn chance that rises quickly from 0 to its maximum once reputation drops below the minimum where scandals start."

## Success check

On `/spel`, at 390×844, 360×640 and 1440×900:

- the three meter tiles are replaced by one chart with two lines (Gebruikers, Geld), each showing its current number and the phase goal line;
- playing a card or an event option changes those two numbers by the card's effect in absolute units, and the chart animates to the new point;
- while a card is dragged, or open in its detail dialog, dashed forecast points show both values after that card;
- reputation is not shown; below the scandal threshold a "Schandaal dreigt: N% per beurt" warning shows the engine's per-turn scandal chance, and a scandal opens as a 3-option event;
- the balance simulation proves the intended endings per strategy;
- the board still fits without document scroll.

## In scope

- **Engine:** Gebruikers and Geld become absolute, canonical state. The users/revenue meters, `usersForMeter` and gross omzet go. Card and event effects land directly on them, scaled per phase. Reputation and toxicity stay hidden 0–100. A seeded per-turn scandal chance draws scandal events. Goals and game overs read the two values. Save version bump.
- **Content:** scandal tags on the existing toxicity events, phase scale factors, retuned goals, balance simulation.
- **Board:** a `ScoreChart` replaces `MeterPanel`; forecast on drag and in the detail dialog; scandal-risk warning; card faces; screen reader.
- **End flow:** result, share and end report show users and money.
- **Docs:** DOC_GAME_DESIGN § 2, 6, 7; feature READMEs.
- **Cleanup:** delete the `score-mockup` feature, its page and its route.

## Out of scope

- Will NOT do: the momentum or trend model (D1, superseded by D11); company value (variant B); new event content beyond retagging and a few scandal texts if the pool per phase is too thin.
- Will NOT touch: the feed, follower comments, card imagery, juice kinds per card type, desktop split and mobile fit rules, event modal UX (event-redesign), audio, auth.

## Edges

| Feature area                                         | Loop today                                                                                | Hook point                                                                          | Ride / new         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| game-engine                                          | meters 0–100 + derived stats, toxicity triggers, goals, game overs                        | state shape, `turnEffects`, `progression` (goals, game over, pacing + scandal draw) | ride — core change |
| game-content                                         | cards/events with meter effects, `CONTENT_PHASES`, balance sim, UI copy                   | phase scale factors, scandal tags, goals, copy, simulation                          | ride               |
| game-save                                            | `SAVED_RUN_VERSION = 3`                                                                   | bump to 4 (old run discarded by the existing path)                                  | ride               |
| game-board                                           | `MeterPanel`, `PhaseProgress`, `boardView`, `CardDraft`/`CardDetailDialog`, screen reader | `ScoreChart`, forecast, risk warning, card faces                                    | ride               |
| game-juice                                           | `MeterJuice` accents/flashes per meter, count-up                                          | retarget accents to the chart's two values                                          | ride               |
| kit `GameCard`                                       | effect rows per meter (`GAME_CARD_METERS`)                                                | effect rows as users/money deltas (D15 open)                                        | ride               |
| game-flow / result-share                             | end screen + share card read `usersText`/`revenueText`, peak users                        | final users + money                                                                 | ride               |
| score-mockup, `App.tsx`, `pages/ScoreMockupPage.tsx` | throwaway mockup                                                                          | delete                                                                              | removal            |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M+ overall, cut into three laps:

- **L1 — Engine + content + balance (M):** game-engine, game-content, game-save. The board maps the new state onto the existing tiles temporarily (two numbers + hidden reputation), so `/spel` keeps working between laps.
- **L2 — Chart HUD (M):** game-board, game-juice, kit `GameCard`: chart, forecast, risk warning, card faces, screen reader. Deletes the mockup.
- **L3 — End flow + docs (S):** game-flow and result-share texts, share card, how-to-play, glossary, DOC_GAME_DESIGN.

## Decisions

DECISIONS.md D1–D9 (lap 0; D1, D2, D8 and D9's trigger superseded) and D10–D18 (build). Open: D15 (card faces), D16 (game overs), D17 (phase goals; the orchestrator is asking the owner).
