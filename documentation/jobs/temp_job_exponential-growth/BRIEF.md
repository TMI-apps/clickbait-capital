# Brief: exponential-growth

**Problem.** Owner request: "The gameplay should be retuned to capture the exponential success an app can have. The player should start with 0 users and the effects should be incremental." Runs started at 50.000 users / € 100.000 and users gains were a fixed amount per point per phase, so the users line rose mostly linearly.

**Success check.**

- A run starts at 0 users with a small seed of money; bankruptcy stays the only game over.
- Users gains are a small fixed base plus a share of the current users (viral the biggest share, news a small one); ads turn users into money per user with a small relative user loss; fines grow with the platform.
- Goals ×10 per phase; balance simulation (60 seeds): human-like wins most runs in a median 25–45 turns, about as many turns per phase; viral-only, ad-only and news-heavy never win; a median human-like run's users per turn reported.
- Card faces, forecasts and tiles read well with millions ("1,2 mln"); chart stays correct from zero.
- Copy (phase intros, how-to-play, tutorial), design doc, decision log, `SAVED_RUN_VERSION` 6 → 7.
- Preview at 390×844 and 1440×900: users start at 0, accelerating curve, forecast on hold, no errors, no document scroll.

**In scope.** game-engine (`turnEffects.ts`, `gameEngine.ts`, `progression.ts`, types, seed content), game-content (balance, phases, news cards, copy, simulation), game-board (number format), game-save (version), READMEs, design doc, decision log.

**Out of scope.** Chart geometry (zero-based linear axis stays, chart-timeline D6), card texts beyond news user signs, new mechanics.

**Size.** M (engine model change + retune + copy), one lap.

## Plan

1. Engine: `usersChange` (base + share), money gains per user (`moneyPerUserPerPoint`), drop `audienceUsers` / `audienceFactor`; scandal fine with a users part; urgent scandal before a milestone. Tests in `turnEffects.test.ts`, `gameEngine.test.ts`, `progression.test.ts`.
2. Content: start values, goals, costs, growth rates; news users positive; tune with the simulation; add the per-phase-turns and curve assertions.
3. Board: compact million format in `formatScore`.
4. Copy, docs, save v7; Playwright on the preview.

**Pattern & precedent.** Incremental/idle games (Cookie Clicker, AdVenture Capitalist) and tycoon games (Game Dev Story) grow by a share of what you own and set each milestone an order of magnitude higher, so every step takes similar time while the numbers explode; real platforms monetise per user (ARPU) and regulators fine a share of turnover (DSA up to 6 %). The model follows that: base + percentage for users, euros per user for ads, fines with a users part, ×10 goals. Reuse check: no package — a handful of formulas in the existing pure engine.
