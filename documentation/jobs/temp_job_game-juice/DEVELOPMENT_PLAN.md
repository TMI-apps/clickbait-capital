# Development plan: Game juice + wasted gains

## Summary

- **Goal:** asymmetric per-type feedback (design § 5), meter count/flash, card draw stagger, end entrance, wasted-gain MAX marks.
- **Brief:** `BRIEF.md` · **Decisions:** `DECISIONS.md`
- **Size:** M — new feature + board integration + kit prop + tokens.
- **Acceptance test:** `src/features/game-juice/services/juicePlan.test.ts`, `src/features/game-board/services/boardView.test.ts` (overflow), `src/features/game-board/components/GameBoard.test.tsx` (juice layer on viral play; none under reduced motion).
- **Plan review:** Done 2026-11-04 as a single-agent review against the contract below (one fix: count-up writes text via a ref, not state, to avoid per-frame React renders). The size-M parallel lens review ran in loop-check on the implementation (Amendments 1–8).

## Phase overview

| Phase | Goal                                                                                    | Gate                                        | Status |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| 1     | Pure services + tests (juicePlan, particles, duration parse, overflow)                  | unit tests green                            | Done   |
| 2     | Tokens + keyframes, hooks, components (JuiceLayer, MeterJuice, CountUpNumber, EndJuice) | type-check, lint                            | Done   |
| 3     | Board + kit integration, READMEs, ARCHITECTURE.md, decision log                         | full tooling gate                           | Done   |
| 4     | Playwright play-test 390/820/1280 + reduced motion                                      | screenshots, no console errors, no h-scroll | Done   |
| 5     | loop-check fixes (Amendments)                                                           | full tooling gate                           | Done   |

## Conflict & compliance

- Applicable rules: architecture (layers, cross-feature via `api/`), code-style (naming, complexity), testing, file-placement.
- File placements: `src/features/game-juice/{api,components,hooks,services,types}`, README.
- Reuse / packages: none needed — CSS keyframes + WAAPI (D2). `tw-animate-css` `animate-in` already used for chips.
- Foundation cleanup: none.
- Naming: role names (`useMotionPreference`, `CountUpNumber`, `JuiceLayer`, `planJuice`) — mechanisms, not caller-named.

## Review contract

- **Rules pinned:** `rules@64d9c67` — architecture, code-style, testing, file-placement, agent-behavior.
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass.
- **Locked decisions:** game-board D1–D12, DECISIONS.md D1–D8.

### Amendments

| #   | Date       | Source                      | Change                                                                                                                           | Applied to                           |
| --- | ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | 2026-11-04 | loop-check naming (Blocker) | Third copy of the meter cap removed: `MeterView.full` from `boardView` (second copy of engine `METER_MAX`, F2 marker)            | boardView, MeterPanel, types         |
| 2   | 2026-11-04 | loop-check naming           | One `CapBadge` kit component for card rows and full meters (was two copies)                                                      | GameCard kit, MeterPanel             |
| 3   | 2026-11-04 | loop-check UI lens          | Full-meter "MAX" moved to the label row (overflowed the value row at 360px); hidden from screen readers (aria-valuetext says it) | MeterPanel                           |
| 4   | 2026-11-04 | loop-check design § 5       | News: no flash and no count-up (D8)                                                                                              | juicePlan, MeterPanel, CountUpNumber |
| 5   | 2026-11-04 | loop-check perf             | End-screen flash unmounts after it plays                                                                                         | JuiceLayer                           |
| 6   | 2026-11-04 | loop-check testing          | Tests: EndJuice win/loss, MeterPanel MAX, event-option cap, ad gold / news shield on the board, matchMedia mock restored         | tests                                |
| 7   | 2026-11-04 | loop-check plan compliance  | ARCHITECTURE.md lists game-juice                                                                                                 | ARCHITECTURE.md                      |
| 8   | 2026-11-04 | loop-check docs             | Comment and decision wording aligned with code                                                                                   | useActionJuice, DECISIONS            |

## Pattern & precedent

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| **Capability** | Per-action reward feedback scaled by type                                     |
| **Precedents** | Balatro / Hearthstone card juice, slot-machine count-up, iOS reduced-motion   |
| **Alignment**  | Matches: particles + count-up for rewards, instant state under reduced motion |
