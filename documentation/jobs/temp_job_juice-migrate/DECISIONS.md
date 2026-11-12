# Decisions — juice-migrate

Job: `temp_job_juice-migrate`
Updated: 2026-11-12

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Emit at the source | closed | `card.played` from the play handler (origin = the card element, still on screen), `event.choice` from the choose handler, `ui.press` from `withTap`'s replacement. Engine-derived moments come from the pure `juiceForLastStep` (follow-up: milestones; reveal: meters, feed, outcome), with the old guards: nothing for steps replayed from a save or before the first action | loop-refine | lost: deriving everything from the session (no origin element, no handler semantics) |
| D2 | Sound timing in recipes | closed | The 250 ms gap between the action sound and its follow-up moves into the recipes (`at: 250` on `phase.up`, `run.won`, `run.lost`, `event.appeared` sounds; meter blips already had it), so every event is emitted at once and the visuals start on the action (the end screen's entrance no longer waits) | loop-plan | replaces game-board D12's `SOUND_STAGGER_MS` |
| D3 | Meter blip with the reveal | closed | The single meter blip (≥ 10 %, a loss wins, none after a milestone) rides on `meter.changed` `-big`. After an event answer it plays with the flash once the dialog has closed (~200 ms later than before), in sync with what the player sees | loop-plan | amends event-juice-drop D3 ("sounds stay on the choice") for the blip only; the choice sound stays at the choice |
| D4 | News and journalism stay dull | closed | `meter.changed` `dull` for a news card or a journalism answer: no flash and no blip (the blip used to play for news too); feed `news` enters with a short linear slide, no overshoot | loop-plan | design § 5 "intentioneel saai"; recipe test enforces it |
| D5 | Accent marks are moments | closed | The 🔥 / 💰 / 🛡️ marks show for 1.6 s with the action instead of staying until the next one | loop-plan | the delta chips and the chart carry the lasting state; marks are feedback |
| D6 | Mount entrances vs moments | closed | Moments go through juice events: feed post landing, end screen, outcome rows, particles, flashes, marks, sounds. Plain mount entrances of reusable UI stay CSS: card draw / play (kit), comment slide (follower-comments) | loop-refine | one path per moment; CSS keeps what any mount of the component does |
| D7 | New `enter` primitive | closed | `enter` (fade in from a `dy` offset and `scale`, spring or linear easing) in `motionEffects.ts`; reduced motion skips it, so the element just appears | loop-plan | needed by the feed landing and the end screen, and reusable for lap 3–4 entrances |
| D8 | Outcome rows | closed | `EffectsJuice` emits `event.outcome` (`variant` = option kind: accent on the row of that kind) and one `outcome.row` per row (`gain` / `loss` / `dull`, `vars.row` = `outcome:<meter>`): entrance plus flash. Row anchors are a span in the kit's per-row `overlay` slot | loop-plan | count-up stays `CountUpNumber` (state-bound) |
| D9 | Vibration off until its setting | closed | The game passes `haptics: false` to the director until lap 4 adds the player's "Trillen" setting (juice-core D10); the recipes already carry their vibration steps | loop-plan (plan review) | no player gets vibration without an off switch |
| D10 | Pitch variation | closed | The small `rateJitter` (±4 %) on card sounds ships now | loop-plan | part of the owner's audio juice; recipes tune it |

## Open

(none)

## Log

- 2026-11-12 — D1, D6 closed via loop-refine (clear winner); D2–D5, D7, D8 via loop-plan (clear winner); D9, D10 via plan review
