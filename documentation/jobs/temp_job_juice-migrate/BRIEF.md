# Brief — Game juice system (lap 2 of 4: migrate the board onto juice events)

Task: Full game juice system (orchestrator backlog) · Lap: temp_job_juice-migrate · Harness: v0.45.0 · Previous lap: juice-core (#61)

## Problem

The board still runs the one-off juice path (`useActionJuice` / `planJuice` / `JuiceLayer` / `MeterJuice` / `EndJuice` / `FEED_ENTRANCE`, sounds via `boardSounds` / `useBoardSounds` / `withTap`) next to the new event system from lap 1. That leaves two paths, and the recipes and inspector don't yet control the game.

## Success check

Playing `/spel`, every action's feedback comes from the recipes: a viral card plays `card.played · viral` (shake, 🔥😱😡 from the card, glow and 🔥 on Gebruikers, its sound); an event answer plays `event.choice` at once and `event.resolved` plus the meter flashes after its dialog closes; the IPO / loss plays `run.won` / `run.lost`. An inspector override (e.g. viral particle count) changes what `/spel` shows. None of the old one-off juice modules remain.

## In scope

- Gameplay emits catalog events at the source:
  - `card.played` from the play handler, with the card as origin;
  - `event.choice` from the choose handler;
  - `ui.press` replaces `withTap`'s sound.
- A pure board mapping `juiceForLastStep` replaces `boardSounds`. It gives:
  - the follow-up: `phase.up`, `run.won`, `run.lost`, `event.appeared`;
  - the reveal: `event.resolved`, `meter.changed` per meter (`dull` for news and journalism, at most one `-big`, none when a milestone happened), `feed.landed`.
- `useBoardJuice` replaces `useBoardSounds` and `useActionJuice`. It emits the follow-up on each new step, and the reveal once the event dialog has closed. It holds the meters on the pre-choice view meanwhile and gives the comments' reveal key.
- Anchors: `board`, `meter:users`, `meter:revenue`, `feed:newest`, `end-screen`, and the event dialog's outcome rows (`outcome:users`, `outcome:revenue`).
- New `enter` primitive (entrance: fade in from an offset and scale) for the feed post landing and the end screen.
- Event outcome reveal (`EffectsJuice`) emits `event.outcome` (accent per option kind) and `outcome.row` per row (entrance plus gain / loss flash, `dull` for journalism). The count-up stays `CountUpNumber`.
- Delete: `juicePlan`, `eventJuice`, `feedEntrance`, `useActionJuice` (+ test), `useShake`, `JuiceLayer`, `MeterJuice`, `EndJuice` (+ test), `juice.types.ts`, `boardSounds` (+ test), `useBoardSounds`, the juice keyframes in `src/index.css` that nothing uses any more. Update the tests that asserted the old DOM.
- The inspector's mock board gains the new anchors.

## Out of scope

- Will NOT do (lap 3): new moments such as drag, hold, forecast, comments, floaters, goals, scandal ramp, money danger; new sounds.
- Will NOT do (lap 4): phase intro, buttons and navigation beyond replacing `withTap`, the settings (Trillen), the rule pointer.
- Will NOT touch: game rules, the score chart, the comment reveal animation (CSS `animate-juice-slide` in follower-comments stays a mount entrance), card draw / play CSS entrances (kit).

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `game-board` | `useBoardSession` → `soundsForLastStep` → `useBoardSounds`; `PlayingBoard` → `useActionJuice` → `JuiceLayer` / `MeterPanel` `MeterJuice`; `PhoneFeed` `FEED_ENTRANCE`; `GameBoard` `EndJuice`, `withTap` | `boardJuice.ts`, `useBoardJuice.ts`, handlers, anchors | ride |
| `game-juice` | old path + catalog / recipes | delete the old path; add events (`event.outcome`, `outcome.row`), `enter` steps, end entrance; `EffectsJuice` emits | ride |
| `juice-effects` | 14 primitives | `enter` primitive in `motionEffects.ts` | ride |
| `game-flow` | `EventModal` → `EffectsJuice action={juiceActionForEvent(kind)}` | pass the option kind | ride |
| `juice-inspector` | mock anchors | add outcome rows and end screen | ride |
| `src/index.css` | juice keyframes | remove the unused ones | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M. Six areas, mostly deletions and mechanical rewiring, plus one primitive and a pure mapping with tests.

Cut into laps: juice-wiring-board (lap 3) and juice-wiring-flow (lap 4), as in juice-core.

## Decisions

`DECISIONS.md` D1–D8.
