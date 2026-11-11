# Brief: deck-draw

**Problem.** Player feedback via the owner: cards don't feel shuffled, hands often hold too much of one type, and the same card shows two turns in a row. With independent per-slot type rolls (balance-cleanup D2) one of each was only 2/9 ≈ 22 % of hands and three of one type 1/9 ≈ 11 %; the draw had no memory.

**Success check.**

- Hand mix: one of each is the most common hand, a pair plus one less common, three of one type rare (target about 60 / 35 / 5 %); every type still about 1/3 of the slots; slot order random.
- Draw piles per type and phase; every shown card goes to the bottom; no card in two consecutive hands; a card returns only after a measurable gap; small pools and phase changes handled.
- Pure and deterministic per seed + action log; the deck is engine state; `SAVED_RUN_VERSION` 5 → 6; resume replays.
- Balance simulation (60 seeds, all strategies) before/after, plus the measured hand mix and repeat gap.
- Preview at 390×844 over ~20 turns: no repeats in consecutive hands, mostly mixed hands, no errors, no document scroll.

**In scope.** game-engine (`drawDeck.ts`, types, seed content), game-content (`handMix`, simulation), game-save (version), READMEs, design doc, decision log.

**Out of scope.** Card content and balance values (unless the simulation needs a retune: it didn't), board UI.

**Size.** S.

## Plan

1. `services/drawDeck.ts`: `rollHandTypes` (one weighted roll on `BalanceConfig.handMix`), per-type piles in `GameState.deck`, shown cards to the bottom, last hand held back, phase-change carry-over. Tests first (`drawDeck.test.ts`).
2. Engine: `advance` draws from the deck; `createGame` starts with `deck: null`.
3. Simulation: record hands, measure mix and repeat gap, assert them; rerun all strategies.
4. Save v6, READMEs, design doc, decision rows; Playwright on the preview.

**Pattern & precedent.** Tetris-style bag randomizer (7-bag) and deck/discard piles (board and deck-builder games) are the standard answers to "random but not streaky". A pure type bag was rejected for the mix: a 2-of-each 6-bag gives 40 % one-of-each and 60 % pair, never a triple, and couples consecutive hands. A weighted composition table (loot-table style) hits the owner's target exactly and is one tunable config. Reuse check: no package — the logic is ~150 lines on the run's own seeded RNG; any shuffle library would bring its own RNG and break replay.
