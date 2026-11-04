# Decisions — game-board

Job: `temp_job_game-board`
Updated: 2026-11-04

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Content input | closed | `GameBoard` takes `content: GameContent`; `GamePage` passes `SEED_CONTENT` | loop-refine | swapping in game-content is one import line in the page (orchestrator brief) |
| D2 | Tap behaviour | closed | one tap plays the card; details via an info button | loop-refine | clear-winner: task says play by tap; select-then-confirm adds a step; info button is accessible where long-press is not |
| D3 | Drag | closed | `@dnd-kit/core` (already a dependency, used by tasks) with a distance-activated pointer sensor, so tap and drag coexist | loop-refine | no new dependency |
| D4 | Fullscreen board | closed | `/spel` hides the Topbar (like `/tasks`); the pause menu holds quit | loop-refine | clear-winner: vertical space on a phone, and the logo link would quit a run by accident |
| D5 | Event and end dialogs | closed | `Modal` gets `dismissible={false}` (no X, Escape and overlay do nothing) | loop-refine | an event must be answered; kit change is a prop, not a parallel dialog |
| D6 | Droogte marker | closed | board wraps viral cards in a destructive-colour ring plus an icon and "Droogte" label | loop-refine | colour never the only signal; no GameCard prop needed |
| D7 | Narrow phone draft | closed | three cards in one row, `min-w-0` on the card instance (width is instance scope) | loop-refine | no horizontal scroll at 390px |

## Open

| id | topic | status | options briefly | blocked phase |
|----|-------|--------|-----------------|---------------|

## Log

- 2026-11-04 — D1–D7 closed via loop-refine (clear-winner)
