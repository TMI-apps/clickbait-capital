# Juice engine

The game-agnostic runtime of the juice system: gameplay **emits semantic events**, a **director** plays each event's **recipe** (a timed list of effect steps) with the current **tuning**, gated by the player's settings. No card, meter or phase words live here: the game's event catalog and recipes are `src/features/game-juice/`, the effect primitives `src/features/juice-effects/`, the dev tool `src/features/juice-inspector/`.

## Purpose

- `createJuiceBus<Events>()` — typed `emit(name, payload)` / `listen(listener)`. A failing listener never breaks gameplay; events with no listener are dropped (juice is never load-bearing).
- `createJuiceDirector(...)` — plays a recipe: shared `steps`, then `variants[payload.variant]`; each step after `at` × motion scale; gated per channel; scaled by intensity × payload `strength`; flash guard, concurrency cap, cooldowns, `stop(tag)`, `cancelAll()`.
- `createJuiceTuning(...)` — the one place juice is adjusted: shipped recipes ⊕ per-step overrides, global knobs (intensity, motion scale, volume, haptics), persisted (debounced), JSON export, `reload` for other tabs.
- `defineJuiceEffect(...)` — declares an effect primitive: id, channel, reduced-motion behaviour, tunable params (unit, range, optional `default` for params a step may leave out), `run`. The inspector draws its controls from these params.
- `JuiceStage` — the one overlay effects draw into; `useJuiceAnchor(name)` — makes an element a named target; `useJuiceDirector(...)` — bus → director for a component's lifetime; `useJuiceTuning(store)` — live view for editors.

## Structure

| Layer      | Path                         | Purpose                                                                              |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| API        | `api/index.ts`               | Public surface                                                                       |
| Components | `components/JuiceStage.tsx`  | Fixed, click-through, `aria-hidden` overlay; registers itself as the stage           |
| Hooks      | `hooks/useJuiceDirector.ts`  | Bus → director while mounted; `storage` event → `tuning.reload()`; cancel on unmount |
| Hooks      | `hooks/useJuiceAnchor.ts`    | Ref callback registering a named anchor                                              |
| Hooks      | `hooks/useJuiceTuning.ts`    | `useSyncExternalStore` view of a tuning store                                        |
| Services   | `services/juiceBus.ts`       | Typed event bus                                                                      |
| Services   | `services/juiceDirector.ts`  | Recipe player: variants, delays, gates, flash guard, caps, cooldown, tags            |
| Services   | `services/juiceTuning.ts`    | Tuning store, override parsing / merging, ranges                                     |
| Services   | `services/juiceEffect.ts`    | `defineJuiceEffect`, `JUICE_LIMITS`, param readers                                   |
| Services   | `services/juiceAnchors.ts`   | Anchor and stage registries (StrictMode-safe)                                        |
| Services   | `services/motionTokens.ts`   | Read CSS duration tokens in JS                                                       |
| Types      | `types/juiceEngine.types.ts` | Steps, recipes, payloads, tuning, gates, effect contract                             |

## Rules the director enforces

| Rule            | Value (`JUICE_LIMITS`)                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reduced motion  | `skip` effects dropped, `static` effects shown without movement, `keep` played                                                                                                                                                                   |
| Haptics         | only with tuning `haptics`, the player's gate, and no reduced motion                                                                                                                                                                             |
| Screen flashes  | at most `screenFlashesPerSecond` (3) per rolling second (WCAG 2.3.1), checked after `{var}` templates fill the target; effects spend a token too (`claimScreenFlash`) when a non-screen target covers ≥ `screenAreaShare` (25 %) of the viewport |
| Concurrent runs | `concurrentRuns` (6); the oldest run is cancelled                                                                                                                                                                                                |
| Cooldown        | starts only when the event actually played a step                                                                                                                                                                                                |
| Payload typing  | `emit` requires the payload when the catalog entry has required fields                                                                                                                                                                           |
| Intensity       | tuning × payload `strength` (0–2), at most `maxIntensity`                                                                                                                                                                                        |
| Hidden tab      | steps that come due while the page is hidden are dropped                                                                                                                                                                                         |
| Missing target  | a step whose anchor is missing or detached is skipped by its effect, never throws                                                                                                                                                                |

Effects apply the other ceilings themselves (screen opacity, live particles, vibration pulse, time-warp length, callout read time).

## Decisions

Lap log: `documentation/jobs/temp_job_juice-core/DECISIONS.md` (until it is removed after landing).

- **D1 — Events, recipes, primitives (juice-core D1).** Gameplay never calls an effect; adding juice = a recipe entry, tuning = data. Precedent: Feel / MMFeedbacks (timed feedback lists with a global intensity), FMOD / Wwise (named events mapped to sounds in data).
- **D2 — Game-agnostic (juice-core D2).** The engine knows events, steps, channels and anchors only; a game supplies its catalog, recipes, effects registry and gates.
- **D3 — Named anchors (juice-core D4).** Targets are `"origin"` (the payload's element or point), `"screen"`, or an anchor name with `{var}` templates (`"meter:{meter}"`). Registries keep the newest element and unregister only their own.
- **D4 — Accessibility (juice-core D8, A6, A7).** See the rules table. Sound plays under reduced motion on purpose: it is not motion, and the mute switch covers it.
- **D5 — Tuning persists (juice-core D6).** Overrides live in `localStorage` under the caller's key (the game uses its `clickbait-capital:` prefix, so "Voortgang wissen" clears them), written 250 ms after the last change.

## Testing

Colocated Vitest: `services/juiceDirector.test.ts` (variants, delays × motion scale, reduced / static, haptic gates, flash guard, cooldown, concurrency, tags, chance, strength, unknowns, templates; manual clock), `services/juiceTuning.test.ts` (defaults, overrides, clamps, debounced persistence, reset, reload, export, blocked storage, defensive parsing), `services/motionTokens.test.ts`.

## Dependencies

None outside React. Consumers: `juice-effects`, `game-juice`, `juice-inspector`.
