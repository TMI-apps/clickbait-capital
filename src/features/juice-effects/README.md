# Juice effects

The primitive library of the juice system: one small effect per juice idea, each declared with `defineJuiceEffect` (`@/features/juice-engine/api`) so its channel, reduced-motion form and tunable params live in one place. Game-agnostic: colours are theme token names, targets are anchor names, sounds go through a port. The game's registry is `src/features/game-juice/services/gameJuiceRuntime.ts`.

## Effects

| Id          | Channel | Reduced motion | What it does                                                       | Key params                                                           |
| ----------- | ------- | -------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `shake`     | motion  | skip           | Horizontal shake of the target (composite add)                     | `target`, `strength` px (≤ 16), `duration`                           |
| `pop`       | motion  | skip           | Squash & stretch: wide-flat, tall-thin, rest                       | `target`, `scale` (peak), `duration`                                 |
| `pulse`     | motion  | skip           | The target beats `times` times                                     | `target`, `scale`, `times`, `duration` (beat)                        |
| `zoom`      | motion  | skip           | Push-in that holds and eases back                                  | `target`, `scale`, `duration`                                        |
| `timeWarp`  | motion  | skip           | Hit-stop (rate 0) / slow-mo of the juice's own animations only     | `rate` 0–1, `duration` (≤ 300 ms)                                    |
| `flash`     | motion  | skip           | Colour wash in and out (screen: ≤ 0.3 opacity, counted as a flash) | `target`, `color`, `opacity`, `duration`                             |
| `glow`      | motion  | skip           | Glowing ring that beats                                            | `target`, `color`, `times`, `duration`                               |
| `tint`      | motion  | skip           | Coloured vignette that holds and fades (mood)                      | `target`, `color`, `opacity`, `duration`                             |
| `badge`     | motion  | static         | Glyph pops onto the target's top-right corner                      | `target`, `glyph`, `duration`                                        |
| `particles` | motion  | skip           | Glyphs burst out or fly to a target; optional soft glow behind     | `from`, `to`, `glyphs`, `count`, `reach`, `size`, `glow`, `duration` |
| `floater`   | motion  | static         | Text / number rises from the target and fades                      | `target`, `text` (`{var}`), `color`, `rise`                          |
| `callout`   | motion  | static         | Pill of text pops and stays readable (≥ 1.5 s)                     | `target`, `text`, `color`, `duration`                                |
| `sound`     | sound   | keep           | Plays a sound id through the port; volume × master, pitch jitter   | `id`, `volume`, `rate`, `rateJitter`                                 |
| `haptic`    | haptic  | (skipped)      | `navigator.vibrate` pattern "pulse pause pulse" (Android only)     | `pattern`                                                            |

Durations are ms before the motion scale. Intensity (tuning × payload strength) scales amplitude, overshoot, count and opacity; the ceilings are `JUICE_LIMITS`.

## How to add a primitive

1. Add its step interface to `types/juiceEffects.types.ts` and to the `JuiceEffectStep` union.
2. Define it with `defineJuiceEffect<YourStep>({ id, channel, reducedMotion, params, run })` in the service file of its mechanism (transform → `motionEffects.ts`, overlay node → `overlayEffects.ts`, flying / text nodes → `stageEffects.ts`, sound / vibration → `deviceEffects.ts`). Animate transform / opacity only, through `animateJuice` / `playNode` (tracked, self-removing), and return a cancel.
3. Export it from `api/index.ts` and add it to the game registry (`createGameJuiceEffects` in game-juice). The inspector draws its controls from `params`.
4. Test it in the colocated test with `installAnimateStub` and `createJuiceTestContext` from `tests/test-utils.tsx`.

## Structure

| Layer    | Path                          | Purpose                                                                   |
| -------- | ----------------------------- | ------------------------------------------------------------------------- |
| API      | `api/index.ts`                | Public surface                                                            |
| Services | `services/motionEffects.ts`   | `shake`, `pop`, `pulse`, `zoom`, `timeWarp`                               |
| Services | `services/overlayEffects.ts`  | `flash`, `glow`, `tint`, `badge`; stage-node / WAAPI helpers              |
| Services | `services/stageEffects.ts`    | `particles` (pooled, live cap), `floater`, `callout`                      |
| Services | `services/deviceEffects.ts`   | `createSoundEffect(port)`, `haptic`                                       |
| Services | `services/particlePaths.ts`   | Deterministic burst / target paths, `splitGlyphs` (moved from game-juice) |
| Types    | `types/juiceEffects.types.ts` | Step interfaces, `JuiceEffectStep`, `SoundPort`                           |

## Decisions

- **D1 — Native Web Animations, no library (juice-core D3, D7).** Transform / opacity only; nodes live on the engine's stage and remove themselves; particle nodes are pooled. canvas-confetti, tsParticles and Motion were weighed: the emoji glyphs are the look (design § 5) and WAAPI covers the rest.
- **D2 — No game words (A4).** Colours are theme token names (`tokenColor("type-viral")` → `var(--type-viral)`), so the game decides which colour means what.
- **D3 — Screen-safety ceilings live in the effect (A6).** Screen opacity ≤ 0.3, ≤ 48 live particles, vibration pulses ≤ 60 ms, time warp ≤ 300 ms, callouts ≥ 1.5 s — applied after intensity and overrides, so no tuning can pass them.
- **D4 — Time warp touches only juice animations (A7).** It never slows the app's own UI transitions. Overlapping warps share one restore: every animation gets its pre-warp rate back when the last warp ends.
- **D5 — Screen-level overlays.** A flash, glow or tint on `screen`, or on any target covering ≥ 25 % of the viewport, is capped at 0.3 opacity and spends a screen-flash token; a screen-level glow beats once, ≥ 400 ms. Nodes clean up on finish and on cancel (`oncancel`).
- **D6 — Haptics are fire-and-forget.** `navigator.vibrate(0)` would also stop a newer buzz, so a vibration is never cancelled; pulses are ≤ 60 ms.

## Testing

Colocated Vitest with the Web Animations stub: `services/motionEffects.test.ts`, `overlayEffects.test.ts`, `stageEffects.test.ts`, `deviceEffects.test.ts`, `particlePaths.test.ts`.

## Dependencies

- `@/features/juice-engine/api` (effect contract, limits, helpers).
