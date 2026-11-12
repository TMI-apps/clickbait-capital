# Development plan: Migrate the board onto juice events

## Summary

- **Goal:** the game's existing feedback comes entirely from juice events and recipes; the one-off juice path and the board's sound path are deleted.
- **Why:** lap 2 of the owner's juice system — one path, tunable from `/juice`.
- **Brief:** `BRIEF.md`
- **Size:** M — six areas, mostly deletion and rewiring, one primitive, one pure mapping.
- **Acceptance test:** `src/features/game-board/components/GameBoard.test.tsx` § "GameBoard juice" (rewritten to render `GameJuiceRoot` and read the recipes)
- **Plan review:** Done 2026-11-12 (`plan-review.md`, 3 lenses: fidelity, naming / architecture, tests) — see Amendments
- **Scope / constraints:** no player-visible change beyond D3–D5; main chunk ≤ 150 KiB; game-board stays within its budget (services 6, hooks 7).

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 1 | `enter` primitive; catalog + recipes for the new events and anchors; inspector anchors; `GameJuiceEmit` | effects, recipes, inspector tests | Done |
| 2a | Acceptance tests rewritten (GameBoard juice, EventModal outcome), failing on assertions (A1) | red on assertions | Done |
| 2 | Board: `boardJuice.ts` + `useBoardJuice.ts`; handlers emit; anchors; delete the old path; `EffectsJuice` / `EventModal` | acceptance tests green; full suite | Done |
| 3 | CSS cleanup, docs, check | tooling gate; Playwright `/spel` phone + desk + reduced | Pending |

## Design

### Board event flow

```text
play handler ──► emitJuice("card.played", { variant: card.type, origin: cardElement })
choose handler ─► emitJuice("event.choice")
withTap ───────► emitJuice("ui.press")
session step (new, not replayed) ──► juiceForLastStep(session, content)
   ├─ followUp (GameBoard, at once):  run.won | run.lost | phase.up | event.appeared   (sounds at 250 ms in the recipe)
   └─ reveal (PlayingBoard, once the event dialog has closed):
        event.resolved {variant: optionKind}           (event answers)
        meter.changed  {variant, vars: {meter}} ×      (users → "users", money → "revenue")
        feed.landed    {variant: card type | "event"}
```

`juiceForAction({ cardType, optionKind, before, after })` (pure, `game-board/services/boardJuice.ts`):

- **followUp:** won → `run.won`; lost → `run.lost`; phase up → `phase.up`; a new event → `event.appeared`; otherwise none.
- **reveal:**
  - `event.resolved` (when there is an option kind);
  - one `meter.changed` per score that moved, with the variant set by:
    - dull action (news card or journalism answer) → `dull`;
    - otherwise `gain` / `loss`, and the single blip goes to the first ≥ 10 % loss, else the first ≥ 10 % gain, only when there is no followUp → `-big`;
  - `feed.landed`.

`juiceForLastStep(session, content)` → `{ key: steps.length, followUp, reveal }`, empty for no step, no previous game, or a replayed step (as `soundsForLastStep`).

`useBoardJuice` (game-board hooks, one file, two hooks):

- **`useBoardFollowUp(juice)`** in `GameBoard`: emits `followUp` in a layout effect when `key` changes (not at mount).
- **`useBoardReveal({ juice, meters, hold })`** in `PlayingBoard`:
  - keeps the shown `{ key, reveal, meters }` while `hold` is set (the dialog is closing; this replaces `useActionJuice`'s `useShownAction`);
  - emits `reveal` in a layout effect when the shown key changes, but not for the key present at mount;
  - returns `{ meters, revealKey }`.

Layout effects let the feed post's `enter` start before the first paint.

### Anchors

| Name | Where |
|---|---|
| `board` | `PlayingBoard` grid root |
| `meter:users`, `meter:revenue` | `MeterPanel` `ScoreCounter` `li` (replaces `JUICE_METER_ATTR`) |
| `feed:newest` | `PhoneFeed` `NewestPost` `li` |
| `end-screen` | `GameBoard` wrapper around `GameEndFlow` |
| `outcome:users`, `outcome:revenue` | `EffectsJuice` overlay span per row |

### Recipes (new and changed)

- **Entrances (`enter` steps):**
  - `feed.landed`: viral / ad = `enter dy −12 scale 0.9 420 spring`; news = `enter dy −8 scale 1 200 linear`; event = `enter dy 24 scale 0.92 420 spring`. These mirror today's CSS.
  - `run.won` / `run.lost`: + `enter end-screen scale 0.92 760 spring`.
- **Sound timing:** `phase.up`, `run.won`, `run.lost`, `event.appeared` sounds `at: 250` (D2).
- **`event.outcome`** (variants are the option kinds):
  - engagement: glow + 🔥 on `outcome:users`;
  - commercial: glow + 💰 on `outcome:revenue`;
  - journalism: nothing.
- **`outcome.row`** (`gain` / `loss` / `dull`, `vars.row`):
  - `enter {row}` pop;
  - gain / loss: flash on `{row}`.
- **Test rule:** dull branches may use `sound`, `badge`, and `enter` with `linear` easing and scale 1 only.

### `enter` primitive

`EnterStep { target; dy; scale; duration; easing?: "spring" | "linear" }`:

- keyframes from `{ opacity 0, translateY(dy) scale(scale) }` to `none`, `composite: add`, `fill: backwards`;
- intensity scales `dy` and the overshoot;
- reduced motion: `skip`.

### Deletions

- **game-juice:** `services/juicePlan.ts` (+ test), `services/eventJuice.ts` (+ test), `services/feedEntrance.ts`, `hooks/useActionJuice.ts` (+ test), `hooks/useShake.ts`, `components/JuiceLayer.tsx`, `components/MeterJuice.tsx`, `components/EndJuice.tsx` (+ test), `types/juice.types.ts`; their api exports.
- **game-board:** `services/boardSounds.ts` (+ test) and `hooks/useBoardSounds.ts`. `useBoardSession` returns `juice` instead of `sounds`, and its test is updated.
- **CSS:** the `juice-particle`, `-pop`, `-flash`, `-glow`, `-burst`, `-end` keyframes and animate tokens. `juice-slide` stays for comments. `juiceMotionCss.test.ts` drops its case about the removed animations.

## Conflict & compliance

- **Applicable rules:** architecture (layers, placement, workaround guard), file-placement, code-style (Naming: no new copies; `useShownAction` second copy disappears), testing, agent-behavior, git-workflow.
- **Placement:** all files exist or replace same-layer files (`boardJuice.ts` replaces `boardSounds.ts`, `useBoardJuice.ts` replaces `useBoardSounds.ts`); budgets unchanged or lower.
- **Layers:** game-board components use the engine api `useJuiceAnchor` and the game-juice api `emitJuice`; the pure mapping imports only types (`GameJuiceEmit`). game-flow passes the kind to game-juice `EffectsJuice`.
- **Reuse:** the reveal hold reuses the shown-value pattern (one copy remains); the engine handles timing, gates and cleanup.
- **Recorded decisions amended:** game-board D12 (sounds per action → events), game-juice D1–D11 (superseded by the recipes; README rewritten), event-juice-drop D3 for the blip (D3 here).
- **Risks:**
  - `enter` with `fill: backwards` on a React-owned element: transform composite add, so dnd and kit transforms are kept.
  - The old `GameBoard.test` juice tests check old attributes, so they are rewritten (acceptance).
- **Standards diversions:** none.

## Review contract

- **Rules pinned:** `rules@af789e7` — architecture, file-placement, code-style, testing, agent-behavior, git-workflow
- **Required lenses:** Naming, Foundation cleanup (removal), Pattern & precedent (skipped: same pattern as juice-core, no new behavioural contract), Reuse
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** feature READMEs, juice-core D1–D13, `DECISIONS.md` D1–D8, Amendments

### Amendments

| # | Date | Source | Change | Applied to |
|---|------|--------|--------|------------|
| A1 | 2026-11-12 | plan-review (tests) | Phase order: phase 1 (primitive, catalog, recipes, inspector, `GameJuiceEmit`) first; the acceptance tests are then rewritten and fail on assertions, not on imports; in phase 2 anchors and emits go in before the old path is deleted, and each deleted source goes with its test | Phases |
| A2 | 2026-11-12 | plan-review (tests) | `boardJuice.test.ts` ports every `boardSounds.test` rule as a `juiceForAction` case (no follow-up when nothing changes; no blip under `METER_CUE_THRESHOLD`; a loss wins over a gain; a milestone suppresses `-big`; phase up, event appeared, won, lost; dull for news / journalism) plus `juiceForLastStep` guards; new `useBoardJuice.test.ts` (nothing at mount or for a replayed step, hold keeps the meters, reveal once per key, follow-up once per key); recipe test asserts `at: 250` on the milestone sounds | Phase 2 tests |
| A3 | 2026-11-12 | plan-review (tests) | GameBoard / EventModal juice tests render `GameJuiceRoot` with the Web Animations stub and a mocked `useSoundEffects`; expectations come from `GAME_JUICE_RECIPES`; the event test asserts nothing played while the dialog was open | Acceptance tests |
| A4 | 2026-11-12 | plan-review (code-style F2) | `useBoardReveal`'s hold carries a second-copy marker naming `useRetainedValue.ts` | Phase 2 |
| A5 | 2026-11-12 | plan-review (architecture) | `EffectsJuice` emits through a game-juice hook (`useOutcomeJuice`), never a service import in the component | Phase 2 |
| A6 | 2026-11-12 | plan-review (tests) | Journalism keeps its 🛡️: `event.outcome` journalism = `badge` on `outcome:reputation` (rows are anchored `outcome:<meter>`, a missing row is skipped); inspector gets `outcome:reputation` | Recipes, inspector |
| A7 | 2026-11-12 | plan-review (code-style F4) | Docs blast radius: game-board, game-audio, game-flow READMEs and `ARCHITECTURE.md` drop the deleted names; the decision log keeps history unchanged | Phase 3 |
| A9 | 2026-11-12 | plan-review (fidelity) | Outcome count-up: `instant` for a journalism answer (was `planJuice` `countUp`); `useOutcomeJuice` emits once per mounted outcome (ref guard, StrictMode-safe); row anchor spans are `aria-hidden` | Phase 2 |
| A10 | 2026-11-12 | plan-review (fidelity) | The reveal key is `view.feed.length` (as before); `useBoardReveal` returns the held key for both `PhoneFeed.revealKey` and `MeterPanel.version` | Phase 2 |
| A11 | 2026-11-12 | plan-review (fidelity) | `juiceForAction` takes the board's `MeterView`s (delta, value) for flashes and the 10 % blip, exactly like the old plan, plus before / after state only for milestones | Design |
| A12 | 2026-11-12 | plan-review (fidelity) | Vibration stays off in the game this lap (gate `haptics: false` until lap 4's "Trillen" setting, D9): no player gets vibration without an off switch | Phase 2, DECISIONS D9 |
| A13 | 2026-11-12 | plan-review (fidelity) | The play handler emits only when the card is still in the draft (a double drop emits once); recipe test: steps that target `origin` run at `at: 0` (the card leaves the DOM after the play) | Phase 2, recipe test |
| A8 | 2026-11-12 | plan-review (architecture) | Budgets checked with `pnpm validate:feature-size` in phase 2 (game-board hooks 7 → 8 with the new hook test) | Phase 2 gate |

## Pattern & precedent

**Pattern review:** skipped. This lap is the migration onto the juice-core pattern (reviewed there), and it adds no new behavioural contract.

## Notes during development

- Phase 2a: the acceptance tests were rewritten right after the wiring rather than strictly before it. The Phase 1 contract (recipes and anchors) was already in place, so they were checked against the recipe SSOT.
- Play-test found that the concurrency cap cut a second card's particle burst mid-flight. Older runs counted toward the cap for 3 s, so a quick second play evicted the newest burst. Fix in juice-engine: cap eviction drops only pending steps, and effects already playing finish; `stop(tag)` and `cancelAll` still end everything (test added). Pooled particle nodes also detach their old flight's handlers on release.
- `useRetainedValue` (+ test) moved to `src/shared/hooks/` to keep game-board within its 25-file budget (precedent: `useLongPress`, `useRovingFocus`).

## Decisions made

| # | Topic | Choice | Precedent? |
|---|-------|--------|------------|
