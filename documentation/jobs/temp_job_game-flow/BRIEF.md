# Brief — Events, phase transitions and endings

Task: Events, phase transitions and endings · Lap: temp_job_game-flow · Branch: feat/game-flow

## Problem
The board shows events and endings in minimal dialogs, has no phase transition screens, and the IPO win has no end report — the game's learning moment (what the win cost society) is missing.

## Success check
On `/spel`: a run starts with the phase 1 intro; each milestone shows a full-screen phase transition (intro, tip, new goal) before the board continues; events open a non-dismissible modal with the three policy options and phase-scaled effects; each of the three game overs and the IPO win shows a dramatic ending screen that leads to a sober results screen (stats, what went into the feed, the end report lines from `buildEndReport`) with "Opnieuw spelen" and "Naar het begin". Keyboard-only playable, 44px targets, prefers-reduced-motion respected, no console errors at 390 / 820 / 1280px.

## In scope
- `src/features/game-flow/` (new, README): `EventModal`, `PhaseTransitionScreen`, `GameEndFlow` (`EndingScreen` → `ResultsScreen`), `usePhaseIntro`, pure view services, tests.
- `src/features/game-board/`: replace `EventDialog` / `GameEndDialog` with the game-flow components; the end view becomes a run summary (engine-derived numbers, board formatting).

## Out of scope
- Will NOT do: share button (separate proposed task), juice/animation beyond simple entrance fades, settings, audio.
- Will NOT touch: `src/features/game-engine/`, `src/features/game-content/`, `src/features/game-audio/`, `src/config/app-tasks.json`.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `src/features/game-flow/` | Not found | new feature, `api/` barrel | new |
| `src/features/game-board/` | minimal event + end dialogs | `GameBoard` render branch, `boardView.toRunSummary` | ride |
| `src/features/game-content/api` | `PHASE_INTROS`, `GAME_OVER_TEXTS`, `buildEndReport`, `UI_COPY` | read-only | ride |

## Size
M — one new feature (~15 files), board integration, browser play-tests at three widths.

## Decisions
- D1 Screens replace the board (full-screen, normal DOM, heading focused on mount); only the event stays a modal over the board.
- D2 The phase 1 intro shows at the start of every run (PHASE_INTROS: "shown when the phase starts"); a transition always shows before a milestone event of the same turn; an ending always wins over a pending transition.
- D3 Results for a game over reuse the report lines except the IPO valuation (no IPO happened); title, intro and closing of the report only on a win.
- D4 Number formatting stays in game-board (`boardView`); game-flow receives formatted stat texts plus raw numbers for `buildEndReport` (no third copy of the nl-NL formatters).
