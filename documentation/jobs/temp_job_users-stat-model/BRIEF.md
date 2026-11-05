# Brief — Users stat derived from the meter

Task: Users stat derived from the meter · Lap: temp_job_users-stat-model · Harness: v0.44.0

## Problem

`stats.users` accumulates `meter delta × phase.usersPerPoint` (game-engine D1), so the "Bereik" a player sees can be 0 while the Gebruikers meter is mid-range, one event can wipe millions, and the board's goal progress does not follow the meter the player steers.

## Success check

In every reachable game state (createGame, playCard, resolveEvent, phase change, game over), `stats.users === round(meters.users × phase.usersAtFullMeter / 100)`: monotone in the meter, > 0 whenever the meter is > 0; and the balance simulation still passes (humanLike median 25–45 turns, viral-only → Verbod, ad-only → Verlaten, news-heavy → Bankroet, rule-of-thumb and humanLike win most games, every event fires).

## In scope

- Engine: users stat derived from the current Gebruikers meter and the current phase's reach at a full meter (`usersAtFullMeter`, replaces `usersPerPoint`); recomputed after every transition, including the phase change. Revenue stays accumulated gross omzet (unchanged rule).
- `BalanceConfig.startStats` → `startRevenue` (the users start is no longer an input).
- Content: per-phase `usersAtFullMeter`; retune values only if the simulation needs it; README balance table before/after.
- Board: goal line shows which Gebruikers level reaches the users goal (derived, not hard-coded copy); D11 text updated.
- Engine README D1, game-content README D5/D8 notes, game-board README D11.

## Out of scope

- Will NOT do: a revenue model change (revenue is cumulative turnover, it never falls, so it cannot show the bug) — excluded.
- Will NOT do: new goal kinds or changing goal targets (100k / 5M / 20M, € 500k) — goals stay stat goals.
- Will NOT touch: settings screen, pause menu, motion setting (game-settings PR #18), `src/config/app-tasks.json`, game-flow end screens (read `stats.users` unchanged).

## Edges

| Feature area | Loop today                                                               | Hook point                                                                                    | Ride / new                  |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------- |
| game-engine  | playCard / resolveEvent → `updateStats` adds delta × usersPerPoint       | `progression.ts` `updateStats`, `gameEngine.ts` `createGame` / `progressPhase`, content types | ride — rule change in place |
| game-content | `CONTENT_PHASES.usersPerPoint`, `CONTENT_BALANCE.startStats`; simulation | `phases.ts`, `balanceSimulation.test.ts` (reads only)                                         | ride — values               |
| game-board   | `toPhaseProgress` → "Bereik: x / doel"                                   | `boardView.ts` `goalStatTexts`                                                                | ride — derived hint         |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — three features, a content-schema field rename, balance retune proven by simulation.
Cut into laps: none

## Decisions

DECISIONS.md D1–D5.
