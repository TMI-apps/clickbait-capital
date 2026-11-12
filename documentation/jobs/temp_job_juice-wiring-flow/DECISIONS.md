# Decisions — juice-wiring-flow

Job: `temp_job_juice-wiring-flow`
Updated: 2026-11-12

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | One press tap, delegated | closed | `GameJuiceRoot` listens to clicks (capture phase) and plays `ui.press` on the pressed button, link or button-like role (origin = the control: tap, 6 ms vibration, tiny squash). `withTap` is removed. Areas with their own juice opt out with `data-juice-press="off"` (event answers, "In de feed", the inspector's triggers) | loop-plan | lost: wrapping each handler (misses new screens). Precedent: a global UI-click sound in game UI frameworks |
| D2 | Page entrance | closed | `page.opened` on each pathname change (not the first load) enters `App.tsx`'s content wrapper (8 px rise, 240 ms); the tap already sounded, so no extra sound. The wrapper carries a plain `data-juice-page` attribute and the lazy root registers it as the `page` anchor: importing the anchor hook into `App.tsx` cost 3.1 KiB of main chunk | loop-plan, loop-check (bundle) | reduced motion skips it |
| D3 | Trillen setting | closed | Store, hook and settings row in game-settings (default Aan, key `clickbait-capital:haptics`); the row shows only where `navigator.vibrate` exists (iOS can't vibrate); the juice director's haptics gate reads it; reduced motion still blocks vibration; "Voortgang wissen" resets it, and game-juice reloads its tuning through `onGameStorageCleared` | owner Q1 = A | second copy of a stored on/off page setting next to the mute (marker left) |
| D4 | Phase intro | closed | `phase.intro` (variant = phase) once per phase screen: the current step dot pops with ✨🚀, the goal box glows; phase 1 adds the phase fanfare at half volume (a run's start), later phases heard it with the action | loop-plan | |
| D5 | Dialog and endings | closed | `event.appeared` glows around the dialog (`event-dialog`, kit `Modal` `contentRef`), `scandal.hit` glows it red twice; `run.won` pops and gold-glows the ending icon (`ending:icon`), `run.lost` shakes it | loop-plan | |
| D6 | Share feedback | closed | `ShareResultButton` reports each finished attempt (`onOutcome`); game-flow maps it (`shareJuiceVariant`): shared / saved / copied → `share.done` `shared` (📣💬✨ from the button, a chime), failed → the button shakes, cancelled → nothing | loop-plan | result-share stays unaware of juice |
| D7 | Rule line | closed | `.claude/rules/architecture.md` § Edge-case placement gains: feedback / juice → emit a game-juice event at the moment, recipes live in `features/game-juice/`, never call effects or sounds from gameplay or UI | owner Q4 = A | the only protected-file change |
| D8 | No-field events | closed | Catalog events without variant or vars use `JuiceNoFields` (`variant?` / `vars?`: never) instead of `Record<string, never>`, so they can still carry the engine's `origin` (`ui.press` on the control) | loop-build | type-only |
| D9 | Real presses only | closed | The press listener ignores script clicks (`isTrusted`; the share download clicks a hidden link), runs in the bubble phase so a click dnd-kit swallows after a drag doesn't tap, and reads the click's `composedPath()` so a control React removed on click (or its opt-out area) still resolves | loop-check (review) | |
| D10 | Phase intro ends with its screen | closed | `phase.intro` carries `PHASE_INTRO_TAG`; `PhaseTransitionScreen` stops it when it closes. Its steps wait 300 ms for the entrance, and a particle step whose anchor is gone bursts from the screen centre, so a quick "Aan de slag" threw the intro's sparkles over the board (seen as a CI failure: 8 extra particles after a news card). The stop also covers StrictMode's double effect run, replacing the ref guard | loop-ship (CI) | |

## Open

(none)

## Log

- 2026-11-12 — D10 via loop-ship (CI); D9 via loop-check (review); D1–D8 closed (loop-plan / loop-build; D3 and D7 carry owner answers Q1 and Q4)
