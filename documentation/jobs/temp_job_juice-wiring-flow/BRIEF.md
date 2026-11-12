# Brief — Game juice system (lap 4 of 4: wire juice into the flow and the app)

Task: Full game juice system (orchestrator backlog) · Lap: temp_job_juice-wiring-flow · Harness: v0.45.0 · Previous laps: juice-core (#61), juice-migrate (#62), juice-wiring-board (#63)

## Problem

After lap 3 the board is juicy, but the rest of the app is not:
- the screens around it (phase intros, the event dialog's arrival, the endings, sharing);
- every button and link outside the board;
- navigation.

Vibration is still off for everyone, because there was no "Trillen" setting (juice-migrate D9).

## Success check

- Every button and link taps, without per-screen wiring.
- A navigation settles the new page in.
- A phase intro lights its step and goal.
- The event dialog glows as it arrives (red for a scandal).
- The ending icon rings (win) or shakes (loss).
- A finished share celebrates, or shakes on a failure.
- On a phone that can vibrate, Instellingen shows "Trillen" (default Aan), and vibration follows it.
- "Voortgang wissen" resets it and the in-memory tuning.
- The architecture rule says where juice goes.
- All of it is triggerable in `/juice`.

## In scope

- **`ui.press`:** delegated app-wide (replaces `withTap`), with the opt-out `data-juice-press="off"`.
- **New events:** `page.opened`, `phase.intro`, `share.done`.
- **Extended recipes:** `event.appeared`, `scandal.hit`, `run.won`, `run.lost`.
- **"Trillen":** a store, hook and settings row in game-settings, wired to the juice director's haptics gate.
- **Reset signal:** `onGameStorageCleared` notifies after "Voortgang wissen".
- **Kit `Modal`:** optional `contentRef`.
- **`ShareResultButton`:** optional `onOutcome`.
- **The one approved line** in `.claude/rules/architecture.md` § Edge-case placement (owner Q4 = A).
- **Inspector:** mock anchors for the new targets.
- **Archive:** the juice-system task goes into `src/config/app-tasks-archive.json`.

## Out of scope

- New sounds: the flow reuses the existing set.
- A player-facing strength setting (owner Q3 = A).
- Count-ups on the results screen.
- Onboarding tutorial overlays: there are none in the app. `/hoe-speel-je` gets the page entrance and button taps.

## Edges

| Feature area | Hook point | Ride / new |
|---|---|---|
| `game-juice` | root hooks, catalog, recipes | ride |
| `game-settings` | haptics store, settings row, reset signal | ride |
| `game-flow` | phase screen, event modal, ending, end-flow hook | ride |
| `result-share` | `onOutcome` prop | ride (presentational) |
| `game-board` | `withTap` removed, "In de feed" opt-out | ride |
| `components/common/Modal` | `contentRef` | ride (presentational) |
| `juice-inspector` | mock anchors, test router | ride |
| `game-content` | `vibrationHint` copy | ride |
| `App.tsx` | `page` anchor | ride |
| `.claude/rules/architecture.md` | one line (approved) | ride |

## Size

M.

## Decisions

`DECISIONS.md` D1–D10.
