# Brief — realistic-effects

Task: orchestrator, owner feedback · Branch: `fix/realistic-effects` · Size: S

## Problem

Each card type had a fixed effect template (`gameContent.test.ts`): news always gave a few users and € 0. So "Een rustige feed voor kinderen" grew the app, while in reality less kijktijd costs users and money. Owner yardstick: what would this decision really do to users and money?

## Success check

`gameContent.test.ts` enforces the new profile (news users ≤ 0 and revenue ≤ 0; every news decision costs users or money; every viral decision earns; lawyer/PR options never lower Toxicity). `balanceSimulation.test.ts`: one-sided strategies stay bankrupt, human-like and rule-of-thumb keep winning most games, a new ethical strategy wins at least half. In the browser a protection card face shows users and money going down.

## Scope

- In: the owner's six fixes (news decisions, datalek/klokkenluider, plain news users 0, PR/lawyer event options, viral decisions earn, two ad decisions without users loss); balance retune in `phases.ts`; `SAVED_RUN_VERSION` 8 → 9; README, design doc, decision log.
- Out: engine code, card-face UI (it already renders the engine's real delta), new cards.
- Edges: `game-content`, `game-save` (version), version literals in `game-session`, `game-board`, `pages` tests.

## Plan

1. Edit effects per the owner list; review all events with the yardstick.
2. New content contract in `gameContent.test.ts` (realistic-effects D1, D2).
3. Retune balance with the simulation; add the ethical strategy (D3, D4).
4. Docs, version bump, browser check on the built app.
