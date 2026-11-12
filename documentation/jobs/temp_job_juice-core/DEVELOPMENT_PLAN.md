# Development plan: Juice core (engine, effects, catalog, inspector)

## Summary

- **Goal:** a reusable, event-driven juice system: gameplay emits typed semantic events, one recipe table maps each to effect primitives, one tuning store adjusts them, and a hidden `/juice` inspector triggers and tunes every event.
- **Why:** owner request — "a reusable system that is deep and modular … easy to add juice, easy to adjust".
- **Brief:** `BRIEF.md` (problem, success check, in / out, edges, lap cut)
- **Size:** M — two new generic features, one dev feature, one ride feature, two moved helpers; gameplay rewiring is lap 2.
- **Acceptance test:** `src/features/juice-inspector/components/JuiceInspector.test.tsx`
- **Plan review:** Done 2026-11-12 (`plan-review.md`) — see Amendments
- **Scope / constraints:** no new dependency; main chunk stays ≤ 150 KiB gzip (baseline 139.7 KiB); the game's current juice is untouched this lap.

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 0 | Acceptance test written, failing | test fails for the missing module | Pending |
| 1 | `juice-engine`: types, bus, anchors, tuning store, director, stage | engine unit tests green; tooling gate | Pending |
| 2 | `juice-effects`: primitives; move `particlePaths` + `motionTokens`; `game-audio` play options | effect unit tests green; game-juice + game-audio tests green | Pending |
| 3 | `game-juice`: catalog, recipes, runtime, `GameJuiceRoot` (lazy in `App.tsx`) | recipe tests green; bundle check | Pending |
| 4 | `juice-inspector` + `/juice` page | acceptance test green; Playwright on `/juice` | Pending |
| 5 | Docs + full check | full tooling gate; READMEs; Playwright phone/desk/reduced | Pending |

## Design

### Vocabulary

| Term | Meaning |
|---|---|
| **Juice event** | A semantic moment, `"<domain>.<moment>"` (`card.played`, `event.resolved`, `run.won`). Payload: `variant?` (picks a recipe branch), `origin?` (Element or screen point), `vars?` (template values: `{meter}`, `{text}`). |
| **Recipe** | Data for one event: `steps` (always) + `variants[variant]` (added). Each step: `{ effect, at?, …params }`. |
| **Effect (primitive)** | A runner `{ channel, reducedMotion, run(step, ctx) → cancel }`. Channels: `motion`, `sound`, `haptic`. `reducedMotion`: `skip` (motion only), `static` (shown without movement), `keep` (not motion: sound, haptic). |
| **Director** | Plays a recipe: picks variant, schedules steps (`at × motionScale`), gates channels, scales by tuning, guards flashes and budgets, cancels on teardown. |
| **Anchor** | A named element effects target: `useJuiceAnchor("meter:users")`. Targets in steps: `"origin"`, `"screen"`, or an anchor name with `{var}` templates (`"meter:{meter}"`). |
| **Tuning** | Global knobs (`intensity` 0–2, `motionScale` 0.25–3, `volume` 0–1, `haptics`) + per-step value overrides on top of the recipe defaults; persisted. |

### Features and files

**`src/features/juice-engine/`** (generic: no game words, no feature imports)
- `types/juiceEngine.types.ts` — `JuiceStepBase`, `JuiceRecipe<S>`, `JuiceRecipeBook<E, S>`, `JuicePayload`, `JuiceEventMap`, `JuiceTuning`, `JuiceOverrides`, `JuiceGates`, `JuiceEffect<S>`, `JuiceEffectContext`, `JuiceTargetPoint`, `Cancel`.
- `services/juiceBus.ts` — `createJuiceBus<E>()` → `{ emit, listen }` (synchronous fan-out, listener errors swallowed and reported once via `console.warn` in dev).
- `services/juiceAnchors.ts` — page anchor registry (`registerAnchor(name, el) → unregister`, `findAnchor(name)`), stage registry (`registerStage`, `getStage`).
- `services/juiceTuning.ts` (+ test) — `createJuiceTuning({ book, defaults, storage })`: `getTuning`, `getBook` (defaults ⊕ overrides, memoized per version), `setGlobal`, `setStepValue(event, branch, index, param, value)`, `reset`, `exportOverrides` (pretty JSON), `subscribe`. Storage errors are swallowed.
- `services/juiceDirector.ts` (+ test) — `createJuiceDirector({ effects, getBook, getTuning, getGates, schedule?, now? })` → `{ play(name, payload), cancelAll() }`. Rules: unknown event / effect → no-op (dev warn); `at` and effect durations × `motionScale`; reduced motion → `skip` effects dropped, `static` effects run with `ctx.reduced = true`; `haptic` channel only when tuning and gates allow; screen-flash guard (≤ 3 flash steps on `screen` per rolling 1000 ms); every run's cancel is tracked and released when it ends.
- `services/motionTokens.ts` (+ test, moved from game-juice) — `parseDurationMs`, `readDurationToken`.
- `components/JuiceStage.tsx` — fixed `inset-0`, `pointer-events-none`, `aria-hidden`, `overflow-hidden`, `z-[60]`, registers itself as the stage.
- `hooks/useJuiceAnchor.ts` — ref callback that registers / unregisters a named anchor.
- `hooks/useJuiceTuning.ts` — `useSyncExternalStore` view of a tuning store (inspector).
- `api/index.ts`, `README.md`.

**`src/features/juice-effects/`** (primitives; imports only `juice-engine` api)
- `types/juiceEffects.types.ts` — the step union `JuiceEffectStep` (one interface per effect, params documented with units), `JuiceTone` (`gain`, `loss`, `viral`, `ad`, `news`, `gold`, `warning`, `neutral`), `SoundPort`.
- `services/transformEffects.ts` (+ test) — `shake`, `pop` (squash & stretch), `pulse`, `zoom`: WAAPI on the target element's transform with `composite: "add"` where supported; intensity scales amplitude.
- `services/overlayEffects.ts` (+ test) — `flash`, `glow`, `tint`, `badge`: a stage node over the target rect (copies its border radius) or the whole screen; opacity-only animation; screen opacity capped at 0.3; `JUICE_TONE_COLOR` maps tones to token CSS vars.
- `services/stageEffects.ts` (+ test) — `particles` (burst or to a target; glyph sets `emoji`, `coin`, `confetti`, `sparkle`, `angry`; optional glow), `floater` (number / text rising from a target), `callout` (pill text popping at a target or screen centre): pooled stage nodes (cap 48 live particles; extra dropped), removed on finish.
- `services/feedbackEffects.ts` (+ test) — `createSoundEffect(port)`, `haptic` (`navigator.vibrate`, pattern × intensity, no-op when unsupported), `timeWarp` (hit-stop / slow-mo: sets `playbackRate` on the stage's and anchors' running animations for a duration).
- `services/particlePaths.ts` (+ test, moved from game-juice; gains glyph sets and an optional `spread`).
- `api/index.ts`, `README.md`.

**`src/features/game-juice/`** (ride: game vocabulary + wiring)
- `types/gameJuiceEvents.types.ts` — `GameJuiceEvents` (event name → payload, typed variants), `GameJuiceEventName`.
- `services/gameJuiceRecipes.ts` (+ test) — `GAME_JUICE_RECIPES`: this lap's catalog, mirroring today's juice: `card.played` (viral / ad / news), `event.resolved` (engagement / commercial / journalism → same steps as the card types), `meter.changed` (gain / loss / gain-big / loss-big), `feed.landed` (viral / ad / news / event), `event.appeared`, `event.choice`, `phase.up`, `run.won`, `run.lost`, `ui.press`. Sound ids typed as `SoundEffectId`.
- `services/gameJuiceRuntime.ts` — page singletons: `gameJuiceBus` + `emitJuice`, `gameJuiceTuning` (key `clickbait-capital:juice-tuning`, so "Voortgang wissen" clears it), `createGameJuiceEffects(soundPort)` (the effect record).
- `components/GameJuiceRoot.tsx` — mounts `JuiceStage`, creates the director with `getGates` from `useReducedMotion` (refs) and the game-audio sound port, listens to the bus; cancels all on unmount. Mounted lazily once in `src/App.tsx`.
- Existing files stay (lap 2 removes the old path); imports of the moved helpers switch to `@/features/juice-effects/api` / `@/features/juice-engine/api`.

**`src/features/juice-inspector/`** (dev tool) + **`src/pages/JuiceInspectorPage.tsx`** + route `/juice` (lazy, unlinked, not public)
- `components/JuiceInspector.tsx` (+ acceptance test) — layout: mock stage left/top, controls right/below.
- `components/InspectorStage.tsx` — mock anchors: `board`, `meter:users`, `meter:revenue`, `meter:reputation`, `chart`, `feed:newest`, a card (origin), a button.
- `components/EventPad.tsx` — one button per event × variant, fires `emitJuice` with the sample payload.
- `components/TuningPanel.tsx` — global sliders (intensity, motion scale, volume, haptics), "Kopieer JSON", "Reset".
- `components/StepEditor.tsx` — the selected event / branch's steps with numeric / text inputs → `setStepValue`.
- `components/EventLog.tsx` — last 20 bus events with time (works for the game too while the inspector is open in another tab? no — same page only; noted).
- `services/inspectorSamples.ts` (+ test: every catalog event and variant has a sample) — sample payloads.
- `api/index.ts`, `README.md`.

**`src/features/game-audio/`** (ride) — `play(id, { volume?, rate? })`: gain × option volume (0–1), `playbackRate` = rate (0.5–2), defaults unchanged. Test added.

### Data flow

```text
gameplay / UI ──emitJuice(name, payload)──► gameJuiceBus ──► director.play
                                                     │            │ book = defaults ⊕ overrides (gameJuiceTuning)
                                       inspector log ┘            │ gates = Beweging (reduced), haptics
                                                                  ▼
                                    steps (at × motionScale) → effect.run(step, ctx{target, stage, intensity, volume, reduced})
                                                                  ▼
                                    WAAPI on anchors / pooled nodes in JuiceStage / sound port / vibrate
```

## Conflict & compliance

- **Applicable rules:** `architecture` (layers, feature granularity, reuse, performance, pattern risk), `file-placement`, `code-style` (Naming, complexity, TS), `testing`, `agent-behavior` (owner questions D10–D13 via orchestrator), `security` (no secrets; only localStorage tuning), `git-workflow` (model C, PR to main).
- **File placements:** all new files under `src/features/<feature>/{api,types,services,components,hooks}` and `src/pages/JuiceInspectorPage.tsx` — allowed by `projectStructure.config.cjs` (features `*` with these layers; pages `*.tsx`). Checked with `pnpm validate:structure` in phase gates.
- **Budgets:** juice-engine 11 files (services 7), juice-effects 13 (services 10 = cap), game-juice 24 after the move (services 9, components 7), juice-inspector 10. No overrides needed.
- **Layers / imports:** engine imports nothing from features; effects → engine api; game-juice → engine, effects, game-audio, game-settings apis; inspector → engine, effects?, game-juice apis; page → inspector api. Barrels only (`no-cross-feature-internals`). `App.tsx` lazy-imports `@/features/game-juice/api` and the page.
- **Reuse / packages:** `spec-reuse-package` (D7): canvas-confetti (ISC, ~5 KB gz, canvas shapes, no emoji glyph look without `shapeFromText`, extra canvas layer), tsParticles (MIT, 40 KB+), party-js (MIT, unmaintained since 2022), Motion `animate` (WAAPI wrapper, ~2–18 KB) and mitt (200 B bus). Native WAAPI + the existing emoji particle code cover it; a 30-line bus beats a dependency. **Recommendation: no new package.**
- **Foundation cleanup:** `particlePaths` and `motionTokens` move to their generic homes (F3 naming pass: names already role names). The rest of the old path (planJuice, useActionJuice, JuiceLayer, MeterJuice, EndJuice, FEED_ENTRANCE, boardSounds) is removed in lap 2 with the rewiring (D9).
- **Security / data:** only `localStorage` for tuning overrides (prefixed, wiped by "Voortgang wissen"); parsed defensively (unknown keys dropped, non-finite numbers rejected).
- **Performance:** transform/opacity only; no layout reads inside animation frames (one `getBoundingClientRect` per step at start); pooled nodes; particle cap; lazy chunk for director + effects + recipes (D5). Bundle checked in phase 3 and 5.
- **Accessibility:** D8; the stage is never focusable; no text in juice is the only carrier of information (callouts duplicate visible state or are flavour).
- **Risks / open questions:** `composite: "add"` support (Safari ≥ 16.4 — fallback replaces, acceptable for short effects); `navigator.vibrate` absent on iOS (no-op); owner questions D10–D13 (none block this lap).
- **Standards diversions:** none.

## Review contract

- **Rules pinned:** `rules@af789e7` — `.claude/rules/architecture.md`, `file-placement.md`, `code-style.md`, `testing.md`, `agent-behavior.md`, `security.md`, `git-workflow.md`
- **Required lenses:** Pattern & precedent, Reuse / packages, Feature decomposition, Foundation cleanup, Naming
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** feature READMEs (game-juice D1–D11, game-audio D1–D6, game-settings D1–D4, game-board juice / sounds), `DECISIONS.md` D1–D9, Decisions made below, Amendments

### Amendments

| # | Date | Source | Change | Applied to |
|---|------|--------|--------|------------|
| A1 | 2026-11-12 | plan-review (arch, scale) | Director lifecycle moves out of the component into generic `juice-engine/hooks/useJuiceDirector.ts` (`{ bus, effects, tuning, gates }`); `GameJuiceRoot` only renders the stage and calls it. App lazy-imports a separate entry `game-juice/api/root.ts` (`GameJuiceRoot` only); `api/index.ts` stays the gameplay barrel. Bus singleton in its own `services/gameJuiceBus.ts`; tuning store created lazily (`getGameJuiceTuning()`), so nothing loads the recipe book at import | Design § game-juice, juice-engine |
| A2 | 2026-11-12 | plan-review (arch) | Each feature's README is written in the phase that creates the feature (pre-commit `validate:feature-docs`), not in phase 5 | Phases 1–4 |
| A3 | 2026-11-12 | plan-review (arch, naming) | Recounted budgets: engine 14 (services 8, hooks 3), effects 12 (services 10 = cap), game-juice 25 at most (services 10: + bus file), inspector 10. Effect files renamed by mechanism: `motionEffects.ts` (shake, pop, pulse, zoom, timeWarp), `overlayEffects.ts` (flash, glow, tint, badge), `stageEffects.ts` (particles, floater, callout), `deviceEffects.ts` (sound port, haptic) | Design § juice-effects |
| A4 | 2026-11-12 | plan-review (naming F1) | No game words in effects: colour is a step param naming a theme token (`color: "type-viral"` → `var(--type-viral)`); game tones live in game-juice recipes | Design § juice-effects |
| A5 | 2026-11-12 | plan-review (naming F2, code-style reuse) | Marker comment `Second copy: replaced by the juice recipes (juice-core lap 2 deletes this)` in `juicePlan.ts`, `useActionJuice.ts`, `useShake.ts`, `JuiceLayer.tsx`, `MeterJuice.tsx`, `EndJuice.tsx`, `feedEntrance.ts`, `boardSounds.ts`. Lap 2 delete list adds `useShake`, `useMotionPreference` (game-juice internal); `useCountUp` / `CountUpNumber` stay (state-bound count, not an event effect). Checked for reuse: `src/shared/hooks` (`useLongPress`, `useRovingFocus` — not relevant), game-juice `useShake` / `useCountUp`, game-settings `useReducedMotion` (used directly by the root, not via the game-juice wrapper) | Conflict & compliance, Phase 3 |
| A6 | 2026-11-12 | plan-review (precedent, a11y, scale) | Director adds: per-recipe `cooldownMs`; max 6 concurrent recipe runs (oldest cancelled); per-step `chance` (seedable RNG); sound `rate` / `volume` as `[min, max]` ranges; recipe `tag` + `stop(tag)` for looping/ramped recipes; payload `strength` (0–2) multiplying intensity for size-dependent juice; steps due while the tab is hidden are dropped; flash guard counts every `screen`-target overlay (flash, tint, glow) — max 3 per rolling second; hard clamps (screen opacity ≤ 0.3, particles ≤ 48 live, haptic pulse ≤ 60 ms) applied after intensity, strength and overrides, exported as constants (`JUICE_LIMITS`) | Design § juice-engine, tests |
| A7 | 2026-11-12 | plan-review (a11y) | Haptics are skipped under reduced motion too (until the owner's haptics setting, D10). `timeWarp` only touches animations the juice started (tracked set), max 300 ms, restored on cancel. Callout / static floater stay ≥ 1.5 s. Sound stays under reduced motion (deliberate: not motion) | Design, recipes |
| A8 | 2026-11-12 | plan-review (a11y, D8) | News dullness enforced by test: news / journalism branches (`card.played` news, `event.resolved` journalism, `feed.landed` news) contain only sound, slide/`badge` steps — no particles, shake, flash, glow, zoom, timeWarp; `meter.changed` gets a `dull` variant (no flash) for news | Phase 3 recipe test |
| A9 | 2026-11-12 | plan-review (tests) | Acceptance test expectations derive from `GAME_JUICE_RECIPES` and `JUICE_LIMITS` (no literals); every new test titled "should … when …"; `particlePaths` + `motionTokens` move together with their tests in phase 2 and all importers (`useCountUp`, `useShake`, `useActionJuice`) are rewired with no shim; `juiceMotionCss.test.ts` stays in game-juice unchanged; tests build tuning stores from the factory, never the page singleton; jsdom stubs `animate` / `getAnimations` | Phases 0–4 |
| A10 | 2026-11-12 | plan-review (scale) | Registries unregister only if they still hold the same element (StrictMode-safe, tested); a missing or disconnected anchor skips the step; tuning writes are debounced (250 ms) and the store reloads on the `storage` event (inspector tab → game tab live) | Design § juice-engine |
| A11 | 2026-11-12 | plan-review (rebel, advisory promoted) | Effects are self-describing: `defineJuiceEffect({ id, channel, reducedMotion, params: { name: { unit, min, max, step, default } }, run })`; the inspector's step editor renders controls from `params`, so a new primitive is one definition plus its registry line | Design, inspector |
| A12 | 2026-11-12 | plan-review (a11y) | Inspector on phones: sticky mock stage, scrollable controls grouped by domain, 44 px targets, number input beside each slider, "Kopieer JSON" with a textarea fallback, a "preview reduced motion" toggle (inspector-only gate override); the event log is not a live region | Phase 4 |

## Pattern & precedent

| Field | Value |
|-------|--------|
| **Capability** | Data-driven game feedback: semantic events → recipes of effect primitives, tunable live |
| **Precedents** | Feel / MMFeedbacks (Unity: a feedback player = timed list of feedbacks with global intensity), FMOD / Wwise (game posts named events; designers map them to sounds in data), "Juice it or lose it" (Jonasson & Purho) primitive list |
| **Aspects reviewed** | Event naming and payloads; recipe as timed step list; global intensity / time scale; per-channel gating (accessibility); live tuning tool; designer-owned data vs code |
| **Findings** | Event → data mapping aligns with FMOD/Wwise; timed step lists + intensity align with Feel; a live inspector aligns with Feel's inspector-time tuning; reduced-motion gating per channel is web-specific and stricter (good) |
| **Verdict** | Aligns with precedent |

## Phases

### Phase 0 — Acceptance test

- **Goal:** the success check as a failing test.
- **Steps:** write `JuiceInspector.test.tsx` (stub `Element.prototype.animate` returning a fake animation, mock `@/features/game-audio/api` sound port): (1) "should play the viral card recipe on the stage when card.played viral is triggered" — 12 `[data-juice-particle]` nodes, sound port called with `card-viral`, board anchor animated; (2) "should keep only sound and static steps when motion is reduced"; (3) "should apply an edited step value on the next run and keep it after a remount".
- **Gate:** test fails (module missing).

### Phase 1 — juice-engine

- **Steps:** types; bus; anchors; tuning (+ test: defaults, overrides merge, invalid storage, export, reset, subscribe); director (+ test with fake effects and a manual scheduler: variant + shared steps, `at` × motionScale, reduced → skip / static, haptics gate, flash guard 3/s, unknown event / effect no-op, cancelAll); move `motionTokens` (+ test from `particlePaths.test` duration cases); `JuiceStage`; `useJuiceAnchor`; `useJuiceTuning`; api.
- **Gate:** `pnpm test:run src/features/juice-engine`; tooling gate (type-check, lint, arch, structure, feature size).

### Phase 2 — juice-effects + game-audio option

- **Steps:** types; four effect services (+ tests: each creates / animates / cleans up its nodes, intensity scales amplitude/count, reduced `static` path, screen opacity cap, particle cap, haptic no-op without `vibrate`, timeWarp restores rates); move `particlePaths` (+ test) and update game-juice imports; `game-audio` `play(id, options)` (+ test).
- **Gate:** effect + game-juice + game-audio tests; tooling gate.

### Phase 3 — game-juice catalog and root

- **Steps:** event catalog types; recipes (+ test: every catalog event has a recipe, every step names a known effect, sound ids exist in `SOUND_EFFECT_IDS`, particle counts within budget (viral 12, ad 10, win 14), screen flashes ≤ 0.3 opacity); runtime singletons; `GameJuiceRoot`; lazy mount in `App.tsx`; api exports.
- **Gate:** tests; `pnpm build && pnpm validate:bundle-size` (main ≤ 150 KiB, expect ~140); tooling gate.

### Phase 4 — juice-inspector and `/juice`

- **Steps:** samples (+ test); components; page; route; acceptance test passes.
- **Gate:** acceptance test; Playwright at 390×844 and 1440×900 on `/juice` (trigger each event, screenshots read), with `reducedMotion: "reduce"`; `/spel` smoke (board unchanged).

### Phase 5 — Docs and check

- **Steps:** READMEs for the three new features + game-juice / game-audio updates; `ARCHITECTURE.md` feature list; fold D1–D9 into READMEs; `loop-check`.
- **Gate:** full tooling gate; acceptance test.

## Notes during development

Advisory (not promoted): fold a thin `card.played` slice into lap 1 (rejected: D9 keeps lap 1 free of gameplay changes; recipes mirror today's juice 1:1 so the format is proven against it in lap 2); dock the inspector as an overlay on `/spel` (later lap, after the standalone page); "Voortgang wissen" should also reset the in-memory tuning (lap 4 with the settings work); ducking / mix buses (out of scope for web); background-tab desync handled by A6 drop rule.

## Decisions made

| # | Topic | Choice | Precedent? |
|---|-------|--------|------------|
