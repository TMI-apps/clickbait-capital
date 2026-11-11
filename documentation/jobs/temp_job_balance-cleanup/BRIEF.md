# Brief: balance-cleanup

**Problem.** The owner asked to work on the balance and remove outdated features: the "Geen nieuws meer" notice (Journalistieke Droogte) is a modifier that no longer fits the score model, and the hand shows too many ads next to the other cards. Each card type should have about a 1/3 chance.

**Success check.**

- No Droogte anywhere: engine rule, balance config, board notice (phone and desktop), screen-reader line, follower cue and lines, copy, docs.
- Each hand slot picks viral, ad or news with equal chance, then a card of that type; hands stay 3 different cards in random order, seeded and replayable; duplicate types stay possible; a type without cards in the phase drops out.
- Balance simulation (60 seeds per strategy): human-like run 25–45 turns and wins most games; viral-only, ad-only and news-heavy always go bankrupt; rule-of-thumb wins most games.
- `SAVED_RUN_VERSION` bumped (replay changes).

**In scope.** game-engine (`drawHand`, `turnEffects`, types, seed content), game-content (balance, followers, copy), game-board (notice removal only), follower-comments (cue), game-save (version), docs.

**Out of scope.** Score HUD L2 (another thread on feat/score-hud), reputation decay (kept: score-redesign D21), the other dead modifier labels' replacements.

**Size.** S.

## Plan

1. Remove Droogte from engine types, `turnEffects`, `gameEngine`, API, seed and content balance; tests.
2. Remove `DroughtNotice`, `droughtWarning`, the drought speech line (and `describeTurn`'s now unused `previous`), the follower `drought` cue and lines, and the unused `UI_COPY.board.modifiers` block.
3. `drawHand`: type first, then card; tests for equal shares on a skewed pool and the empty-type fallback.
4. Rerun the simulation, tune scandal values until every one-sided strategy fails again, bump the save version, update READMEs, design doc and decision log.
