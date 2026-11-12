# Game juice

Action feedback for Clickbait Capital: the asymmetric "juice" of `documentation/DOC_GAME_DESIGN.md` § 5. Dopamine is rewarded loudly, ethics stays dull. Sounds stay in game-audio; the visuals start on the same action render, so they stay in sync.

## Purpose

- **Viral:** light screen shake, a neon pink/purple explosion, 🔥😱😡 flying over the screen, flames on the Gebruikers meter (the "engagement counter").
- **Ad:** coins fly from the card to Inkomsten, gold glow on that meter. The numbers count up like a slot machine.
- **News:** no particles. The post slides into the feed short and dry, and a small green shield appears at Reputatie.
- **Every action:** meters count up or down and flash gain or loss. The feed entrance depends on the type. The end of a run zooms in: a win throws confetti and money with a gold flash, a loss gets a short red flash.

## Structure

| Layer      | Path                                       | Purpose                                                                                                                                                                               |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                             | Public surface: `emitJuice`, the catalog types, recipes, tuning store, effect registry, plus the old components                                                                       |
| API        | `api/root.ts`                              | `GameJuiceRoot` only: `App.tsx` lazy-loads this entry so the director, effects and recipes stay out of the main chunk                                                                 |
| Components | `components/GameJuiceRoot.tsx`             | The juice host mounted once in `App.tsx`: the overlay stage plus the director                                                                                                         |
| Hooks      | `hooks/useGameJuiceDirector.ts`            | Bus → director with the game's effects, the game-audio sound port, the Beweging gate (haptics on until the "Trillen" setting)                                                         |
| Services   | `services/gameJuiceRecipes.ts`             | `GAME_JUICE_RECIPES`: what every catalog event looks, sounds and feels like (content as data)                                                                                         |
| Services   | `services/gameJuiceRuntime.ts`             | `gameJuiceBus` / `emitJuice`, `getGameJuiceTuning()` (persisted overrides), `createGameJuiceEffects(sound)` (the effect registry)                                                     |
| Types      | `types/gameJuiceEvents.types.ts`           | `GameJuiceCatalog`: every event name with its variants and vars                                                                                                                       |
| Components | `components/JuiceLayer.tsx`                | Full-screen, click-through particle overlay that clears itself after the last particle lands                                                                                          |
| Components | `components/MeterJuice.tsx`                | Per-meter flash and accent (flames, gold glow, shield) inside a `relative` meter tile                                                                                                 |
| Components | `components/CountUpNumber.tsx`             | A number that counts to its new value (or from `from`, e.g. 0 for a reveal)                                                                                                           |
| Components | `components/EffectsJuice.tsx`              | Kit `GameCardEffects` with the action's juice per row: count-up from 0, flash, accent                                                                                                 |
| Components | `components/EndJuice.tsx`                  | Entrance wrapper for the end screens                                                                                                                                                  |
| Hooks      | `hooks/useActionJuice.ts`                  | Per-action plan, shake, particle measuring (`useParticleBurst`, `useEndBurst`), card origin; `hold` keeps the previous action while a dialog closes; `useRevealPlan` for effect lists |
| Hooks      | `hooks/useShake.ts`, `hooks/useCountUp.ts` | Web Animations shake; rAF count-up that writes text through a ref                                                                                                                     |
| Services   | `services/juicePlan.ts`                    | `planJuice(action, meters)`: the feedback matrix as data; particle budgets                                                                                                            |
| Services   | `services/eventJuice.ts`                   | `juiceActionForEvent(kind)` / `juiceActionForPost(post)`: the card juice an event option earns                                                                                        |
| Services   | `services/feedEntrance.ts`                 | Feed entrance class per type                                                                                                                                                          |
| Types      | `types/juice.types.ts`                     | `JuiceAction`, `JuicePlan`, `MeterAccent`, …                                                                                                                                          |

## The juice system

Gameplay and UI **emit semantic events**, and never call effects:

```ts
import { emitJuice } from "@/features/game-juice/api";
emitJuice("card.played", { variant: "viral", origin: cardElement });
```

`GameJuiceRoot` (mounted once in `App.tsx`) plays the event's recipe from `GAME_JUICE_RECIPES` with the current tuning. Effects target named anchors (`useJuiceAnchor("meter:users")` from `@/features/juice-engine/api`), the payload's `origin`, or `"screen"`. Juice is decorative and `aria-hidden`; screen-reader text stays in the board's own live regions, so any callout or floater text must repeat something the board already announces.

**Add juice to a new moment**

1. Add the event to `GameJuiceCatalog` in `types/gameJuiceEvents.types.ts`, with its variants and vars, using a `"<domain>.<moment>"` name.
2. Add its recipe to `GAME_JUICE_RECIPES`: a list of steps, each `{ effect, at?, chance?, …params }`. The effect list and params are in `src/features/juice-effects/README.md`. The recipe test checks effects, sounds, ranges, budgets and that news stays dull.
3. Emit it where the moment happens (`emitJuice`, after the state change renders). Make the elements it targets anchors.
4. Feel it in `/juice`, tune it, and fold the exported JSON back into the recipe (`src/features/juice-inspector/README.md`).

**Adjust juice:** edit the step values in `GAME_JUICE_RECIPES`, or tune them live in `/juice` and copy the JSON. Global intensity, tempo, volume and vibration live in the inspector too. Hard ceilings (`JUICE_LIMITS`) keep any tuning within the accessibility limits.

**A new kind of effect:** see "How to add a primitive" in `src/features/juice-effects/README.md`, then register it in `createGameJuiceEffects`.

## Juice system migration (juice-core)

The event-driven juice system (`juice-engine`, `juice-effects`, this feature's catalog and recipes) replaces the one-off path below. Until juice-core lap 2 rewires the board, `juicePlan`, `useActionJuice`, `useShake`, `JuiceLayer`, `MeterJuice`, `EndJuice`, `feedEntrance` and game-board's `boardSounds` carry a "Second copy" marker naming the recipes as their replacement. `particlePaths` moved to `@/features/juice-effects/api` (glyph sets are passed in: `PARTICLE_GLYPHS` in `juicePlan.ts`) and `motionTokens` to `@/features/juice-engine/api`.

## Decisions

Lap log: `documentation/jobs/temp_job_game-juice/DECISIONS.md` (until it is removed after landing).

- **D1 — Derived from the board view.** The action is the newest feed entry's type, the deltas are the meters' deltas, and the key is the feed length. No engine or session changes. Nothing fires for the state present at mount, for example when the board returns from a phase intro.
- **D2 — No animation library.** CSS keyframes in `src/index.css` animate only transform and opacity: particles, flashes, glows and entrances. The Web Animations API runs the board shake, and `requestAnimationFrame` runs the count-up text.
- **D3 — Motion preference.** Game juice follows the in-app Beweging setting: every juice hook reads `useReducedMotion` from `@/features/game-settings/api` directly (the internal wrapper hook went in juice-core) (the one source of truth; juice-motion-setting D2). With reduced motion there are no particles, no shake, no flash overlay and the numbers change at once, but the accents, delta chips and MAX marks still show. The juice CSS durations (`duration-juice`, `duration-juice-shake`, `duration-count`) drop to 0.01ms in the reduced-motion token context and under "Verminderd".
- **D4 — Particle budgets.** Viral 12, ad 10, news and plain events 0, win 14. An answered event plays the juice of its option's kind (D10), so its budget is that card type's. Particles are a single text glyph each, with `will-change: transform`. The overlay empties itself when the last particle lands.
- **D5 — Wasted gains.** Game-board's `capEffects` caps a card's gain at the meter's room to 100. The card shows the part that still counts plus a greyed "MAX" (the kit's `CapBadge`, also used on full meters) (screen readers hear "verspild boven het maximum"). A full meter glows and shows "MAX". Passive costs and turn modifiers are not previewed (game-board D10).
- **D6 — Accent meters.** Flames sit on Gebruikers, gold on Inkomsten and the shield on Reputatie. Each accent has its own shape (🔥, 💰, shield icon), so colour is never the only signal. Accents are decorative (`aria-hidden`); the delta chip states the change.
- **D7 — End entrance here.** `EndJuice` wraps game-flow's `GameEndFlow` in the board, so game-flow stays unchanged.
- **D8 — News stays dull.** A news post gets only the shield: no gain or loss flash, and the meter numbers change at once with no count-up (design § 5: "geen animatie", "intentioneel saai"). Viral, ad and events flash and count.
- **D9 — "Volledig" plays full juice.** When the player picks "Volledig" while the OS asks for reduced motion, `src/index.css` restores only the juice durations under `:root[data-motion="full"]` (values mirror `base.tokens.json`, guarded by `services/juiceMotionCss.test.ts`). The flash, glow and end entrance run on `duration-juice` so they come back too; the rest of the UI keeps following the OS (amends game-settings D3; juice-motion-setting D1).

- **D10 — Event options juice like cards (event-juice-drop D1).** `juiceActionForEvent` maps an option's kind to a card action: engagement → viral, commercial → ad, journalism → news (ethics stays dull). The plain `"event"` action (flash and count only) remains for a post without a kind.
- **D11 — Reveals reuse the board plan (event-juice-drop D2).** `EffectsJuice` fills the kit `GameCardEffects` `decorate` slot with `CountUpNumber` (from 0) and `MeterJuice` from `useRevealPlan` (`planJuice` over the listed changes), and the rows pop with `animate-juice-pop` — no second animation path. Rows get right padding so the accent badge stays clear of the counting number. An effect with `amountText` (absolute amounts like "€ 131.872", score-redesign D15) pops in as that text instead of counting up. `MeterJuice` marks its flash with `data-juice-flash` for tests.
- **D12 — Event-driven juice system (juice-core D1–D13).** Gameplay emits catalog events; `GAME_JUICE_RECIPES` maps them to effect steps; one tuning store adjusts them; `/juice` tunes them live. The engine (`juice-engine`) and the primitives (`juice-effects`) are game-agnostic; the catalog, recipes, sound port and gates live here. `GameJuiceRoot` is lazy (main chunk unchanged). The recipes mirror the one-off juice above until lap 2 moves the board onto them; laps 3–4 add new moments, the "Trillen" setting (D10), new sounds generated by the orchestrator (D11) and a pointer line in the architecture rule (D13). No player-facing intensity setting (D12).

## Testing

Colocated Vitest: `services/gameJuiceRecipes.test.ts` (known effects and sounds, param ranges, news / journalism dull, event outcomes match their card's visuals, particle and screen-flash ceilings); `services/juicePlan.test.ts` (feedback matrix, budgets), `services/particlePaths.test.ts` (paths, determinism, duration parsing), `services/juiceMotionCss.test.ts` ("Volledig" CSS restores the base juice durations), `services/eventJuice.test.ts`, `components/EndJuice.test.tsx`; the event outcome juice in game-flow `components/EventModal.test.tsx`. Board behaviour: `src/features/game-board/components/GameBoard.test.tsx` (viral emoji + flames, ad coins, news none, Verminderd); `hooks/useActionJuice.test.tsx` (OS reduce: Systeem follows it, Volledig overrides it, Verminderd). Browser play-tests with Playwright at 390 / 820 / 1280px, including emulated reduced motion (see the lap's PR).

## Dependencies

- Theme tokens: `duration-juice`, `duration-juice-shake`, `duration-count`, `duration-card-draw`, `ease-card`, and the type and meter colours (`documentation/DOC_THEMING.md`).
- `@/features/game-settings/api` (`useReducedMotion`: the Beweging setting; `GAME_STORAGE_PREFIX`).
- `@/features/juice-engine/api`, `@/features/juice-effects/api` (the juice system), `@/features/game-audio/api` (sound port, `SOUND_EFFECT_IDS`).
- `lucide-react` (`ShieldCheck`).
