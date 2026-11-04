# Development plan — game-engine

Brief: `BRIEF.md` · Size M · Rules pinned: see `git log -1 --format=%h -- .claude/rules` at plan time.

## Conflict & compliance
- Placement (validated against `projectStructure.config.cjs`, flat feature): `src/features/game-engine/{README.md, types/*.ts, services/*.ts, api/index.ts}`. Feature root `index.ts` is not whitelisted for flat features; the public barrel is `api/index.ts` (allowed by the whitelist and named as a public seam by dependency-cruiser `no-cross-feature-internals`). No protected-file edits.
- Layers: services import types only; `api/` re-exports services + types. No React, no hooks, no Supabase.
- Budgets: services ≤ 10 files (9 planned), feature ≤ 25 (~13).
- Reuse: no existing RNG or game code in `src/`; seeded RNG is a 10-line mulberry32 (bespoke, below the spec-reuse-package threshold; no new dependency).
- Testing: TDD (pure functions, `.claude/rules/testing.md`); expected values come from the design doc and the seed content constants.
- Security / DB: none.
- Docs: feature README (Purpose, Structure, Dependencies, decisions D1–D8), `ARCHITECTURE.md` feature line.

## Domain concepts
One bounded concept: the rules of one game run (meters, cards, phases, events are one vocabulary and change together). Content data is a separate concern but only types + a fixture live here; the content lap fills data.

## Pattern & precedent
Reigns-style card management: immutable state + pure reducer-style transitions (`playCard`, `resolveEvent`), seed stored in state, content as data — standard for deterministic card games (replays, tests).

## Phases
1. **Types + RNG.** `types/gameContent.types.ts`, `types/gameState.types.ts`, `services/seededRandom.ts` (+test). Gate: `pnpm test:run`, type-check.
2. **Turn effects.** `services/turnEffects.ts` (+test): card modifiers (Ad-Fatigue, Echo-Chamber, Droogte, news-ignored toxicity, phase multipliers), passive costs, decay, clamping. Gate: tests.
3. **Progression.** `services/progression.ts` (+test): stats mapping (D1), goals (D2), phase advance, IPO win, game overs (D7), event triggers (D6). Gate: tests.
4. **Engine + seed + barrel.** `services/gameEngine.ts` (+test, acceptance), `services/seedContent.ts`, `api/index.ts`. Acceptance test: `services/gameEngine.test.ts` › reproducible seed run, three game overs, IPO win. Gate: full tooling list.
5. **Docs.** README, ARCHITECTURE.md. Gate: `pnpm validate:feature-docs:strict`, `validate:structure`, `arch:check`, `validate:feature-size`, lint, format.

## Review
Size M plan review done inline (single bounded feature, no UI, no data): no amendments.
