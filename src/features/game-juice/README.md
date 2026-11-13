# Game juice

The game's juice: what every moment of Clickbait Capital looks, sounds and feels like — the asymmetric juice of `documentation/DOC_GAME_DESIGN.md` § 5 (dopamine is rewarded loudly, ethics stays dull). It holds the event catalog, the recipe table, `emitJuice`, the juice host (`GameJuiceRoot`) and the outcome reveal. The runtime is `src/features/juice-engine/`, the effects `src/features/juice-effects/`, the tuning tool `/juice` (`src/features/juice-inspector/`).

## Purpose

- **Viral:** a light shake of the board, a neon explosion of 🔥😱😡 from the card, a glow and 🔥 on Gebruikers, the loudest sound.
- **Ad:** a gold glow and 💰 on Geld, a ka-ching; the money gain flies as coins to the Geld line (chart-juice D9).
- **News:** a quiet click; the post slides in short and dry and shows a small 🛡️; meters don't flash.
- **Every action:** each moved meter flashes gain / loss (not after news or journalism); a ≥ 10 % move adds a blip; the new post enters; an answered event plays its option kind's card juice once its dialog has closed, and its outcome rows enter, flash, count up and show the kind's mark.
- **The chart (chart-juice):** each moved line draws in its newest stretch and its end dot reacts by tier (small / medium / big / huge, per line in `CHART_MOVE_TIERS`); up pops, glows and sparks, down shudders, shakes and tints red. Every gain flies its glyphs from the new post to the line's end dot (👤🙋🧑‍💻 / 💶🪙💰, 3 / 6 / 12 / 18 by tier). A streak of ups (3, 5, 8+, `STREAK_LEVELS`) gives the counter a 🔥 chip and the line a glow, and each step plays the gain blip one tone higher; a broken streak shrugs.
- **Milestones and endings:** the next phase, a new event, the IPO (confetti, gold flash, entrance) and a loss (red flash, entrance), each sound 250 ms after the action's own.

## Structure

| Layer      | Path                             | Purpose                                                                                                                                |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                   | `emitJuice`, `emitJuiceEvent`, catalog types, recipes, tuning store, effect registry, `EffectsJuice`, `CountUpNumber`                  |
| API        | `api/root.ts`                    | `GameJuiceRoot` only: `App.tsx` lazy-loads this entry so the director, effects and recipes stay out of the main chunk                  |
| Components | `components/GameJuiceRoot.tsx`   | The juice host mounted once in `App.tsx` (inside the router): overlay stage, director, press tap, page entrance                        |
| Components | `components/EffectsJuice.tsx`    | An event outcome's rows with their anchors (`outcome:<meter>`) and count-up                                                            |
| Components | `components/CountUpNumber.tsx`   | A number that counts to its new value (or from `from`)                                                                                 |
| Hooks      | `hooks/useGameJuiceDirector.ts`  | Bus → director with the game's effects, game-audio sound port, Beweging and Trillen gates, tuning reset on a wipe                      |
| Hooks      | `hooks/useJuicePress.ts`         | App-wide `ui.press`: one click listener on buttons and links (real presses only) (opt out: `data-juice-press="off"`)                   |
| Hooks      | `hooks/usePageJuice.ts`          | `page.opened` on each navigation (not the first load); registers `App.tsx`'s `[data-juice-page]` area as anchor `page`                 |
| Hooks      | `hooks/useOutcomeJuice.ts`       | Emits `event.outcome` and `outcome.row` once per mounted outcome                                                                       |
| Hooks      | `hooks/useCountUp.ts`            | rAF count-up that writes text through a ref                                                                                            |
| Services   | `services/gameJuiceRecipes.ts`   | `GAME_JUICE_RECIPES`: every catalog event's steps (content as data)                                                                    |
| Services   | `services/gameJuiceRuntime.ts`   | `gameJuiceBus` / `emitJuice` / `emitJuiceEvent`, `getGameJuiceTuning()`, `createGameJuiceEffects(sound)`                               |
| Services   | `services/chartJuice.ts`         | `CHART_MOVE_TIERS`, `STREAK_LEVELS` (tunable data) and their pure classifiers (`chartMoveVariant`, `streakStepVariant`, `streakLevel`) |
| Services   | `services/juicePress.ts`         | `pressedControl` (pure): which click counts as a press                                                                                 |
| Types      | `types/gameJuiceEvents.types.ts` | `GameJuiceCatalog`: every event name with its variants and vars                                                                        |

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
3. Emit it where the moment happens: in the handler for a player action, or derived after the state change renders (layout effect, so entrances start before paint). Make the elements it targets anchors.
4. Feel it in `/juice`, tune it, and fold the exported JSON back into the recipe (`src/features/juice-inspector/README.md`).

**Adjust juice:** edit the step values in `GAME_JUICE_RECIPES`, or tune them live in `/juice` and copy the JSON. Global intensity, tempo, volume and vibration live in the inspector too. Hard ceilings (`JUICE_LIMITS`) keep any tuning within the accessibility limits. `emitJuice` is typed per event: an event with required vars (e.g. `meter.changed` needs `vars.meter`) does not compile without them.

**The board's moments** (game-board emits them; lap juice-wiring-board): `card.pickup` (drag start or hold, once per lift), `card.over-feed` (pulses `feed:drop`), `card.cancel`, `forecast.shown` (one beat on `chart`), `comment.arrived` (one per revealed comment, pops `comment:latest`; 60 ms cooldown, so a batch revealed at once under reduced motion pops once), `meter.changed` (now also floats the tile's change text, `vars.text`), `goal.reached` (`vars.meter`), `money.danger`, `scandal.warning` (variant = level 1–3, tag `SCANDAL_WARNING_TAG`) and `scandal.hit` (instead of `event.appeared` when the opened event is a scandal).

**The flow's moments** (lap juice-wiring-flow): `ui.press` on every button and link (delegated; tap, short vibration, tiny squash on the control); `page.opened` (the page settles in); `phase.intro` (variant = phase: the step dot pops with ✨🚀, the goal box glows; phase 1 adds the fanfare softly; tag `PHASE_INTRO_TAG`, stopped when the screen closes); `event.appeared` / `scandal.hit` glow around the dialog (`event-dialog`); `run.won` rings the ending's bell (`ending:icon` pop + gold glow), `run.lost` shakes it; `share.done` (`shared`: 📣💬✨ from the button, `failed`: the button shakes; closing the sheet plays nothing).

**The chart's moments** (lap chart-juice; game-board emits them with the reveal): `chart.moved` per moved line (variant `up-<tier>` / `down-<tier>` / `dull`, `vars.meter`; targets `chart-tail:<meter>` and `chart-dot:<meter>`, anchored by score-chart), `chart.gain` per risen line (variant `<line>-<tier>`, not after news or journalism: glyphs fly from `feed:newest` to `chart-dot:<meter>`), `streak.step` (variant 3–8, `vars.count`; target `streak:<meter>`, the counter's chip) and `streak.broken` (`vars.count`, the counter). Thresholds: `services/chartJuice.ts`, shown in `/juice`.

**A press with its own juice:** mark the control or its area `data-juice-press="off"` (event answers, "In de feed", the inspector's triggers) so it doesn't also tap.

**A new kind of effect:** see "How to add a primitive" in `src/features/juice-effects/README.md`, then register it in `createGameJuiceEffects`.

## Decisions

Lap logs: `documentation/DOC_DECISION_LOG.md` (`juice-core`, `juice-migrate`).

- **D1 — Events at the source, engine moments derived (juice-migrate D1).** Handlers emit the action (`card.played` with the card as origin, `event.choice`, `ui.press`); game-board derives the follow-up and reveal from the session (`juiceForLastStep`), never for the state present at mount or replayed from a save.
- **D2 — No animation library (juice-core D3, D7).** Effects are native Web Animations on transform / opacity; the only CSS juice left is the comment slide (follower-comments) and the kit's card draw / play.
- **D3 — Motion preference.** The director reads `useReducedMotion` (Beweging): motion steps drop or show static (marks), sound plays. Recipes don't read the CSS duration tokens, so "Volledig" over an OS reduce plays full juice without a CSS override (game-juice D9's CSS block remains for the count-up and kit durations).
- **D4 — Budgets and safety (juice-core D8).** Viral 12 particles, ad 10, win 14 (recipe test); screen flashes ≤ 3/s and ≤ 0.3 opacity, ≤ 48 live particles (`JUICE_LIMITS`).
- **D5 — Marks are moments (juice-migrate D5, D12).** 🔥 / 💰 / 🛡️ show for 1.6 s with the action. Colour is never the only signal, because each mark has its own shape. The board has no reputation tile (score-redesign D13), so the news shield sits on the news post once it has landed (`feed.landed` news). Journalism answers stay fully dull.
- **D6 — News stays dull (design § 5; juice-migrate D4).** The recipe test allows news / journalism branches only sound, a mark and a short linear entrance; their meters don't flash or blip.
- **D7 — Event options juice like cards (event-juice-drop D1).** `event.resolved` engagement / commercial / journalism play the viral / ad / news visuals (test-checked).
- **D8 — Outcome reveal (event-juice-drop D2, juice-migrate D8).** `EffectsJuice` anchors each row (`outcome:<meter>`) through the kit's `overlay` slot; `useOutcomeJuice` emits once; numbers count up from 0, at once for journalism.
- **D9 — Sound timing (juice-migrate D2, D3).** Milestone sounds wait 250 ms after the action's sound inside the recipe; the meter blip plays with the reveal (after an event: once its dialog closed).
- **D10 — Vibration off until its setting (juice-migrate D9).** The game passes `haptics: false` until the "Trillen" setting (juice-core D10) lands; the inspector's knob is ready.
- **D12 — Pitch variation (juice-migrate D10).** Card sounds vary their pitch by up to ±4 % (`rateJitter`), so a sound heard twenty times a run doesn't grate.
- **D13 — Outcome marks leave with their dialog.** `event.outcome` / `outcome.row` carry the tag `EVENT_OUTCOME_TAG`; answering the event calls `stopJuice(EVENT_OUTCOME_TAG)`, so no mark floats over the board after the dialog closes. An event post enters at once (behind the closing dialog), not after it.
- **D14 — Board moments (juice-wiring-board D1–D7).** Goal reached and money danger fire on the edge of the shown tiles' `full` / `danger`, with the reveal; the scandal warning ramps per level (1 under 25 %, 2 under 50 %, else 3), plays only when it appears or rises, and is stopped by tag when it goes; a scandal's opening plays `scandal.hit` instead of the event sting; a hold that turns into a drag lifts once; dull moves float nothing; the six board sounds are ElevenLabs files (game-audio README).
- **D15 — One press tap for the whole app (juice-wiring-flow D1).** `GameJuiceRoot` listens to real clicks (`isTrusted`, bubble phase, the click's `composedPath()`) and plays `ui.press` on the pressed control, so new screens tap without wiring; `withTap` is gone. Areas with their own juice opt out with `data-juice-press="off"`.
- **D16 — Vibration follows "Trillen" (juice-wiring-flow D3).** The haptics gate is the player's setting (default on); reduced motion still turns vibration off. "Voortgang wissen" also reloads the tuning (`onGameStorageCleared`).
- **D17 — Adds, doesn't annoy (juice-tone-down D1–D4).** Handling a card is silent: `card.pickup` keeps a tiny pop and vibration (no sound, no glow), `card.over-feed` keeps the slot pulse and vibration, `card.cancel` plays nothing. `comment.arrived` plays its pop at 20 % and rate 0.75 (≈ a quarter of a tap); `ui.press` and the big meter blips play softer. A glow on `origin` stays where the element was when it started, so never glow a card that is about to move.
- **D18 — Chart juice by tier, streaks per line (chart-juice D1–D4).** A move's tier is its distance in shares of the goal, per line (Gebruikers 8 / 25 / 60 %, Geld 4 / 12 / 40 %). Streak levels 3, 5, 8; each step plays `meter-gain` at rate 1.00 → 1.30 (no new sound files); news extends a streak silently and draws its line in dry. The chip and glow are view state (game-board, score-chart); only the moments are juice.
- **D19 — Gains fly to their line (chart-juice D8, D9).** One flight per rise, from the new post to the line's end dot, landing as the dot pops; the ad's coin flight to the counter is gone, so money flies once.
- **D11 — Event-driven juice system (juice-core D1–D13).** Adding juice = a catalog entry and a recipe; adjusting = recipe values or `/juice`.

## Testing

Colocated Vitest:

- `services/gameJuiceRecipes.test.ts`: every step names a registered effect; sound ids exist; params are inside their ranges; news / journalism stay dull; event outcomes match their card's visuals; the particle and screen-flash ceilings hold; milestone sounds sit at 250 ms; origin steps run at once.
- `services/chartJuice.test.ts`: tiers per line and direction, dull, streak steps from the first level capped at the last.
- `services/juiceMotionCss.test.ts`: "Volledig" CSS durations, and no stale juice keyframes.
- Board juice from the recipes: `src/features/game-board/components/GameBoard.test.tsx` § "GameBoard juice", plus the board mapping and hook tests.
- Outcome juice: `src/features/game-flow/components/EventModal.test.tsx`.
- Engine, effects and inspector tests live in their features.

## Dependencies

- `@/features/juice-engine/api`, `@/features/juice-effects/api` (the runtime and primitives).
- `@/features/game-audio/api` (`useSoundEffects` as the sound port, `SOUND_EFFECT_IDS`).
- `@/features/game-settings/api` (`useReducedMotion`, `GAME_STORAGE_PREFIX`).
- Kit: `GameCardEffects` (outcome rows).
