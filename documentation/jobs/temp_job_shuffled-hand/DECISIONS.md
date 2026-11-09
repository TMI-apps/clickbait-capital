| id  | topic        | status | choice | source | notes |
| --- | ------------ | ------ | ------ | ------ | ----- |
| D1  | Random hand  | closed | A hand is 3 cards drawn at random from the phase's whole pool, any category; slot order is the draw order (random each turn) | owner brief via orchestrator | replaces "one of each type" (design § 4 Type 1) |
| D2  | Duplicates   | closed | No duplicate card ids in one hand: draw without replacement | loop-plan | a duplicate would show two identical choices (no real choice) and break per-card ids in the DOM |
| D3  | Save version | closed | `SAVED_RUN_VERSION` 2 → 3; v2 saves are ignored | owner brief | v2 action logs replay into different hands |
| D4  | Retune       | closed | IPO hold (phase 4 `consecutiveTurns`) 10 → 8 in `CONTENT_PHASES`, goal text and intro tip updated | simulation | with 10 the human-like median was 49 turns (target 25–45); 8 → 44, 7 → 42. Smallest change that meets the target; every other assertion held |
| D5  | Simulation   | closed | Type strategies play their type when held, else a fixed fallback order; lookahead strategies score the 3 cards in hand | loop-build | a pure one-type strategy is impossible now; fallbacks avoid the type that would rescue the strategy's failing meter |
