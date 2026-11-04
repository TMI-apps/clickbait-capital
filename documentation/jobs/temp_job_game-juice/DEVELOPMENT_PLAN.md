# Development plan: Game juice + wasted gains

## Summary

- **Goal:** asymmetric per-type feedback (design § 5), meter count/flash, card draw stagger, end entrance, wasted-gain MAX marks.
- **Brief:** `BRIEF.md` · **Decisions:** `DECISIONS.md`
- **Size:** M — new feature + board integration + kit prop + tokens.
- **Acceptance test:** `src/features/game-juice/services/juicePlan.test.ts`, `src/features/game-board/services/boardView.test.ts` (overflow), `src/features/game-board/components/GameBoard.test.tsx` (juice layer on viral play; none under reduced motion).
- **Plan review:** Done 2026-11-04 (self-review against the contract below; one fix: count-up writes text via ref, not state, to avoid per-frame React renders).

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 1 | Pure services + tests (juicePlan, particles, duration parse, overflow) | unit tests green | Done |
| 2 | Tokens + keyframes, hook, components (JuiceLayer, MeterAccent, CountUpNumber, EndJuice) | type-check, lint | Done |
| 3 | Board + kit integration, README, ARCHITECTURE | full tooling gate | Done |
| 4 | Playwright play-test 390/820/1280 + reduced motion | screenshots, no console errors, no h-scroll | Done |

## Conflict & compliance

- Applicable rules: architecture (layers, cross-feature via `api/`), code-style (naming, complexity), testing, file-placement.
- File placements: `src/features/game-juice/{api,components,hooks,services,types}`, README.
- Reuse / packages: none needed — CSS keyframes + WAAPI (D2). `tw-animate-css` `animate-in` already used for chips.
- Foundation cleanup: none.
- Naming: role names (`useMotionPreference`, `CountUpNumber`, `JuiceLayer`, `planJuice`) — mechanisms, not caller-named.

## Review contract

- **Rules pinned:** `rules@64d9c67` — architecture, code-style, testing, file-placement, agent-behavior.
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass.
- **Locked decisions:** game-board D1–D12, DECISIONS.md D1–D7.

## Pattern & precedent

| Field | Value |
|-------|--------|
| **Capability** | Per-action reward feedback scaled by type |
| **Precedents** | Balatro / Hearthstone card juice, slot-machine count-up, iOS reduced-motion |
| **Alignment** | Matches: particles + count-up for rewards, instant state under reduced motion |
