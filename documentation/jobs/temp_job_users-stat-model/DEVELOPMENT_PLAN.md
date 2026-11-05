# Development plan: Users stat derived from the meter

## Summary

- **Goal:** `stats.users` = the Gebruikers meter's share of the current phase's market, so "Bereik" and goal progress follow the meter the player steers.
- **Why:** game-engine D1 accumulates meter deltas × `usersPerPoint`; the stat drifts from the meter (0 at a mid-range meter, millions lost to one event).
- **Brief:** `BRIEF.md`
- **Size:** M — engine rule + content schema field rename + balance retune + board goal line.
- **Acceptance test:** `src/features/game-engine/services/gameEngine.test.ts` › "should read the users stat off the Gebruikers meter and the phase market when any action is taken" (fails on main: stat ≠ meter-derived value).
- **Plan review:** Done 2026-11-05 (`plan-review.md`)
- **Scope / constraints:** avoid game-settings files (PR #18); no edit to `src/config/app-tasks.json`; revenue rule unchanged (DECISIONS D4).

## Phase overview

| Phase | Goal                                                                                           | Gate                                                  | Status |
| ----- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------ |
| 1     | Engine: derived users stat                                                                     | acceptance test + engine tests green, type-check      | Done   |
| 2     | Content: market sizes, retune until the simulation passes; before/after table                  | `balanceSimulation.test.ts` green; game-content tests | Done   |
| 3     | Board: users goal line shows the Gebruikers level that reaches it                              | boardView tests; GameBoard tests                      | Done   |
| 4     | Docs: engine D1, content D5/D8 + simulation table, board D11; play-test `/spel` on the preview | full tooling gate (rule-audit § Tooling pass)         | Done   |

### Phase 1 — engine

- `types/gameContent.types.ts`: `PhaseDefinition.usersPerPoint` → `usersAtFullMeter` (users stat at Gebruikers 100); `BalanceConfig.startStats` → `startRevenue: number`.
- `services/progression.ts`: `usersForMeter(meter, phase)` = `Math.round(meter × usersAtFullMeter / 100)`; `meterForUsers(target, phase)` = lowest integer meter whose `usersForMeter` ≥ target (board readout; same rounding by construction). `updateStats({ stats, meters }, effects, phase)`: users from the new meter, revenue unchanged.
- `services/gameEngine.ts`: `createGame` users = `usersForMeter(startMeter, phase 1)`; `playCard` / `resolveEvent` pass the post-effect meters; `progressPhase` recomputes users with the next phase's market on a phase change (DECISIONS D3).
- `api/index.ts`: export `usersForMeter`, `meterForUsers` (like `scaleForPhase`: the UI shows the engine's numbers).
- `seedContent.ts`: seed markets (phase 1 sized so the existing "100k after two virals" test intent still holds, or the test asserts the meter-derived value).
- `progression.test.ts`: replace the three accumulate tests with `usersForMeter` / `meterForUsers` / `updateStats` cases (monotone, > 0 for meter > 0, revenue never falls).

### Phase 2 — content balance

- `phases.ts`: `usersAtFullMeter` per phase (start: goal reached around Gebruikers 80–90 in phase 1, higher than the entry level in phase 2, holdable in phase 3), `startRevenue: 0`.
- Run the simulation, record before (main) / after per strategy; retune only `usersAtFullMeter` first, other values only if a strategy assertion fails.
- `useGameSession.test.ts` scoring copy reads `stats.users` — no change expected.

### Phase 3 — board

- `boardView.ts` `goalStatTexts`: users condition → `Bereik: x / doel · Gebruikers ≥ N` with `N = meterForUsers(atLeast, phase)`; revenue line unchanged. Progress ratio unchanged (stat / target is now linear in the meter).
- `boardView.test.ts`: case for the hint.

### Phase 4 — docs + play-test

- READMEs: engine D1 rewritten; content D5/D8 sentences on `usersPerPoint` updated, balance table after + before row; board D11 ("Bereik" now follows the meter).
- Playwright on the PR preview `/spel`: a few runs, screenshot goal line vs meter.

## Conflict & compliance

- Applicable rules: architecture (layers: board reads engine api only), code-style (naming, complexity ≤ 3 params → snapshot object), testing (TDD for pure functions; expected values from the shipped formula), file-placement (no new files except lap docs).
- File placements: no new source files.
- Reuse / packages: skipped — two-line pure functions, no generic subsystem.
- Foundation cleanup: `startStats.users` input removed (dead once derived); `usersPerPoint` removed, not aliased (F3: no stale names). `METER_CAP` second-copy marker in boardView untouched.
- Risks: phase-change jump (Bereik rises on a new phase) — intended (D3); simulation lookahead scores `log10(users)` and may change behavior — rerun covers it.
- Standards diversions: none.

## Review contract

- **Rules pinned:** `rules@64d9c67` — architecture, code-style, testing, file-placement, agent-behavior
- **Required lenses:** Pattern & precedent, Reuse / packages (skipped: no generic subsystem), Feature decomposition (no new concept), Foundation cleanup, Naming
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** feature READMEs, DECISIONS.md D1–D5, Amendments

### Amendments

| #   | Date       | Source                           | Change                                                                                                                                  | Applied to                         |
| --- | ---------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| A1  | 2026-11-05 | plan-review (contract)           | Acceptance test records and asserts that it reached a phase change, an event and a game over, and checks the final (lost) state         | Phase 1, Summary › Acceptance test |
| A2  | 2026-11-05 | plan-review (contract)           | Unreachable users goal guarded: `meterForUsers` may exceed 100 (tested); content test asserts `usersAtFullMeter` > every users goal     | Phase 1, Phase 2                   |
| A3  | 2026-11-05 | plan-review (drift, applied)     | One writer of the users stat (`withUsersStat` before the goal check and in `advance`); `updateStats` → `addGrossRevenue` (revenue only) | Phase 1                            |
| A4  | 2026-11-05 | plan-review (advisory, promoted) | Simulation reports `usersGoalMetOnEntry` per phase; README table adds it                                                                | Phase 2                            |

## Pattern & precedent

| Field                | Value                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Capability**       | An absolute "reach" number shown next to a 0–100 health meter                                                                                                            |
| **Precedents**       | Market-share readouts in tycoon/management games (share × market size); Reigns-style meters with a derived headline number; progress bars that equal a stored percentage |
| **Aspects reviewed** | Readability (number explained by the visible meter), monotonicity, phase scaling, goal clarity                                                                           |
| **Findings**         | Aligns: a derived number never contradicts its meter; phase = bigger market matches tycoon games; goal shows the meter target                                            |
| **Verdict**          | Aligns with precedent                                                                                                                                                    |

## Notes during development

- Advisory (plan-review): Bereik now starts at half the phase 1 market (57,500), not 1,000; the "Zolderkamer" start-small feel is weaker. Checked in the play-test.
- Advisory: `gameEngine.test.ts` "100k after two virals" depends on the seed market (140k: two virals from 50 reach ≥ 74 → ≥ 103,600).
- First market set (125k / 6M / 25M) passed every assertion but the users goal held on entry in 57/60 human-like phase-2 games and 60/60 phase-3 games; entry Gebruikers p10–p90 is 85–95. Retuned to 115k / 5.3M / 22.5M (content D9).
- Stale `node_modules` made `pnpm type-check` fail on `virtual:pwa-register/react`; `pnpm install --frozen-lockfile` fixed it (environment, not code).

## Decisions made

| #   | Topic              | Choice                                                                                              | Precedent?                      |
| --- | ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | Users start        | `createGame` sets users 0 and `advance` derives it, so the start also goes through the one writer   | n/a                             |
| 2   | Board label source | "Gebruikers ≥ N" hard-coded in `boardView.ts` next to the existing `STAT_LABEL` ("Bereik", "Omzet") | matches the neighbouring labels |
