# Decisions — juice-core

Job: `temp_job_juice-core`
Updated: 2026-11-12

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Architecture | closed | Semantic events → central recipe table → effect primitives. Gameplay emits `emit("card.played", { variant: "viral", origin })`; the director plays the recipe. Adding juice = a recipe entry; tuning = data. | loop-refine (owner request) | precedent: Feel/MMFeedbacks player lists, FMOD/Wwise event→sound mapping in data. Lost: per-component effect calls (today's one-offs) |
| D2 | Feature split | closed | `juice-engine` (bus, director, anchors, tuning, stage — game-agnostic), `juice-effects` (primitives), `game-juice` (catalog, recipes, wiring, game components), `juice-inspector` (dev tool) | loop-refine | one bounded concept each; budgets (25 files, 10 per layer, tests count) rule out one feature |
| D3 | Effects runtime | closed | Imperative Web Animations on transform/opacity, nodes in one fixed `aria-hidden` stage with a small pool; no React re-render per effect | loop-refine | game-juice D2 (no animation library) carries over |
| D4 | Targets | closed | Named anchors (`useJuiceAnchor("meter:users")`) plus the payload's `origin` element/point and `screen`; replaces the `data-juice-meter` querySelector | loop-refine | lost: CSS selectors in recipes (brittle) |
| D5 | Main-chunk cost | closed | `emit` / bus / anchor hook are tiny and may sit in main; director, effects and recipes load in the lazy `GameJuiceRoot` chunk. Events before it mounts are dropped (juice is never load-bearing) | loop-refine | keeps `validate:bundle-size` (150 KiB) |
| D6 | Inspector access | closed | Hidden, unlinked lazy route `/juice` in every build (not in `PUBLIC_PATHS`, so no canonical), so the owner can tune on PR previews; tuning overrides persist in `localStorage` under the game prefix and also apply in `/spel` | loop-refine (clear winner) | lost: dev-build only (owner could not use it on previews) |
| D7 | Particles package | closed | Keep the custom DOM emoji particles (moved into juice-effects); no new dependency | loop-plan (spec-reuse-package) | canvas-confetti (ISC, ~5 KB gz) draws shapes on canvas; emoji glyphs are the look (design § 5); tsParticles is far heavier |
| D8 | Accessibility | closed | Reduced motion (Beweging) skips motion steps and shows "static" steps (badge, callout, floater) without movement; screen flashes capped at 3/s and 30 % opacity (WCAG 2.3.1); stage is `aria-hidden`, `pointer-events: none`; announcements stay in the board's live regions | loop-refine | carries game-juice D3 / D9 |
| D9 | Lap order | closed | Core + inspector first with recipes mirroring today's juice; migration next lap deletes the old path; new moments in laps 3–4 | loop-refine | the old path stays live for one lap (no player-visible change) |

## Open

| id | topic | status | options briefly | blocked phase |
|----|-------|--------|-----------------|---------------|
| D10 | Haptics setting | open | A (rec) vibrate on key moments + "Trillen" Aan/Uit setting · B follow Beweging only · C no haptics | lap 4 (core ships the gate, default on) |
| D11 | New sounds | open | A (rec) reuse 11 sounds with pitch/volume variation · B generate ~6 new ElevenLabs sounds (credits) | lap 3 |
| D12 | Player intensity setting | open | A (rec) none (Beweging calms; intensity is a tuning knob) · B "Effecten: Vol / Rustig" | lap 4 |
| D13 | Agent pointer | open | A (rec) one line in `.claude/rules/architecture.md` § Edge-case placement · B README only | lap 4 |

## Log

- 2026-11-12 — D1–D6, D8, D9 closed via loop-refine (clear-winner)
- 2026-11-12 — D7 closed via loop-plan (spec-reuse-package)
- 2026-11-12 — D10–D13 opened; sent to the orchestrator with the plan summary
