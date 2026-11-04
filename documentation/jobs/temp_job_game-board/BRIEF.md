# Brief — Playable game board (core loop)

Task: Playable game board (core loop) · Lap: temp_job_game-board · Harness: v0.44.0

## Problem
Players can't play yet: the rules engine and GameCard exist, but there is no board, route or loop UI.

## Success check
On `/spel` a player can play a full game with tap, drag or keyboard only: the 3-card draft (GameCard) feeds the phone feed, the three meters and phase progress update, pending events are resolved in a dialog, and a game over / IPO win shows "Opnieuw spelen" and "Home" — with no horizontal scroll at 390px and no console errors.

## In scope
- `src/features/game-board/` (new, README): `useGameSession` hook over the engine (takes a `GameContent`), pure view mappers (card → GameCard props, meters, phase/goal progress, game-over text), board components: meters, phase + milestone progress, phone feed, draft, card detail dialog, event dialog, end dialog, pause menu.
- Play by tap, drag (existing `@dnd-kit/core`, only if it stays simple), keyboard (arrow keys + Enter/Space).
- Meter transitions on the motion tokens (reduced motion via tokens); Journalistieke Droogte red frame + label on viral cards.
- `/spel` route (`src/pages/GamePage.tsx`, one lazy Route, fullscreen without the Topbar), Start spel on `HomePage` becomes a link.
- `Modal` kit: a non-dismissible option (events and endings must be answered) and a Dutch close label.

## Out of scope
- Will NOT do: juice effects (game-juice lap), phase transition screens / end report (game-flow lap), settings in the pause menu (game-settings lap), audio.
- Will NOT touch: `src/features/game-engine/`, `src/features/game-content/`, GameCard internals, `src/config/app-tasks.json`.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `src/features/game-board/` | Not found | new feature, `api/` barrel | new |
| `src/features/game-engine/api` | pure engine, `SEED_CONTENT` | imported read-only | ride |
| `src/components/common/GameCard` | kit card | new `size="compact"` variant (orchestrator-approved) | ride — kit prop |
| `src/features/game-content/api` | Dutch deck, end texts, UI copy | `GamePage` content, board copy; one tutorial string | ride — orchestrator-approved after game-content merged |
| `src/features/game-engine/api` | public barrel | `scaleForPhase` export (one line) | ride — orchestrator-approved |
| `src/components/common/Modal` | dismissible dialog, English close label | `dismissible` prop, Dutch label | ride — small kit prop |
| `src/pages/` + `src/App.tsx` | Home with disabled Start spel | `GamePage`, `/spel` route, fullscreen route list | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size
M — one new feature (~20 files), a route, a small kit prop, browser play-tests at three widths.
Cut into laps: none.

## Decisions
DECISIONS.md D1…D7.
