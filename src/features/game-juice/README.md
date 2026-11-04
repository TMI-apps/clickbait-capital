# Game juice

Action feedback for Clickbait Capital: the asymmetric "juice" of `documentation/DOC_GAME_DESIGN.md` § 5. Dopamine is rewarded loudly, ethics stays dull. Sounds stay in game-audio; the visuals start on the same action render, so they stay in sync.

## Purpose

- **Viral:** light screen shake, a neon pink/purple explosion, 🔥😱😡 flying over the screen, flames on the Gebruikers meter (the "engagement counter").
- **Ad:** coins fly from the card to Inkomsten, gold glow on that meter. The numbers count up like a slot machine.
- **News:** no particles. The post slides into the feed short and dry, and a small green shield appears at Reputatie.
- **Every action:** meters count up or down and flash gain or loss. The feed entrance depends on the type. The end of a run zooms in: a win throws confetti and money with a gold flash, a loss gets a short red flash.

## Structure

| Layer      | Path                                                        | Purpose                                                                                          |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| API        | `api/index.ts`                                              | Public surface for the board                                                                    |
| Components | `components/JuiceLayer.tsx`                                 | Full-screen, click-through particle overlay that clears itself after the last particle lands    |
| Components | `components/MeterJuice.tsx`                                 | Per-meter flash and accent (flames, gold glow, shield) inside a `relative` meter tile         |
| Components | `components/CountUpNumber.tsx`                              | A number that counts to its new value                                                           |
| Components | `components/EndJuice.tsx`                                   | Entrance wrapper for the end screens                                                            |
| Hooks      | `hooks/useActionJuice.ts`                                   | Per-action plan, shake, particle measuring (`useParticleBurst`, `useEndBurst`), card origin     |
| Hooks      | `hooks/useMotionPreference.ts`                              | The one in-app motion source (D3)                                                               |
| Hooks      | `hooks/useShake.ts`, `hooks/useCountUp.ts`                  | Web Animations shake; rAF count-up that writes text through a ref                               |
| Services   | `services/juicePlan.ts`                                     | `planJuice(action, meters)`: the feedback matrix as data; particle budgets                     |
| Services   | `services/particlePaths.ts`                                 | Deterministic particle paths (burst fan or toward a meter)                                      |
| Services   | `services/motionTokens.ts`, `services/feedEntrance.ts`      | Read duration tokens in JS; feed entrance class per type                                        |
| Types      | `types/juice.types.ts`                                      | `JuiceAction`, `JuicePlan`, `MeterAccent`, …                                                    |

## Decisions

Lap log: `documentation/jobs/temp_job_game-juice/DECISIONS.md` (until it is removed after landing).

- **D1 — Derived from the board view.** The action is the newest feed entry's type, the deltas are the meters' deltas, and the key is the feed length. No engine or session changes. Nothing fires for the state present at mount, for example when the board returns from a phase intro.
- **D2 — No animation library.** CSS keyframes in `src/index.css` animate only transform and opacity: particles, flashes, glows and entrances. The Web Animations API runs the board shake, and `requestAnimationFrame` runs the count-up text.
- **D3 — Motion preference.** `useMotionPreference` is the single place game motion asks. It follows `prefers-reduced-motion` for now; the settings lap backs it with its motion toggle. With reduced motion there are no particles, no shake, no flash overlay and the numbers change at once, but the accents, delta chips and MAX marks still show. The CSS durations (`duration-juice`, `duration-juice-shake`, `duration-count`) drop to 0.01ms in the reduced-motion token context.
- **D4 — Particle budgets.** Viral 12, ad 10, news and events 0, win 14. Particles are a single text glyph each, with `will-change: transform`. The overlay empties itself when the last particle lands.
- **D5 — Wasted gains.** Game-board's `capEffects` caps a card's gain at the meter's room to 100. The card shows the part that still counts plus a greyed "MAX" (screen readers hear "verspild boven het maximum"). A full meter glows and shows "MAX". Passive costs and turn modifiers are not previewed (game-board D10).
- **D6 — Accent meters.** Flames sit on Gebruikers, gold on Inkomsten and the shield on Reputatie. Each accent has its own shape (🔥, 💰, shield icon), so colour is never the only signal. Accents are decorative (`aria-hidden`); the delta chip states the change.
- **D7 — End entrance here.** `EndJuice` wraps game-flow's `GameEndFlow` in the board, so game-flow stays unchanged.

## Testing

Colocated Vitest: `services/juicePlan.test.ts` (feedback matrix, budgets), `services/particlePaths.test.ts` (paths, determinism, duration parsing). Board behaviour: `src/features/game-board/components/GameBoard.test.tsx` (viral emoji + flames, ad coins, news none, reduced motion). Browser play-tests with Playwright at 390 / 820 / 1280px, including emulated reduced motion (see the lap's PR).

## Dependencies

- Theme tokens: `duration-juice`, `duration-juice-shake`, `duration-count`, `duration-card-draw`, `ease-card`, and the type and meter colours (`documentation/DOC_THEMING.md`).
- `lucide-react` (`ShieldCheck`). No other feature imports.
