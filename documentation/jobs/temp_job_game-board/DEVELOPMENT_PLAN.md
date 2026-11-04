# Development plan — game-board

Brief: `BRIEF.md` · Decisions: `DECISIONS.md`

## Acceptance test (first, failing)
`src/features/game-board/hooks/useGameSession.test.ts` § acceptance: with `SEED_CONTENT` and a fixed seed, playing the draft through the hook (always the first card / resolving events with the first option) reaches `won` or `lost`, every played card lands in the feed, and `restart` returns a fresh `playing` game. `GameBoard.test.tsx`: tapping a draft card and pressing Enter on a focused card both play a card; an event opens a non-dismissible dialog; the end dialog shows "Opnieuw spelen" and "Home".

## Shape
| Layer | File | Role |
|---|---|---|
| types | `types/gameBoard.types.ts` | view models (meters, phase progress, draft card, feed entry, event, end) |
| services | `services/boardView.ts` (+ test) | pure engine-state → view mappers; Dutch end texts |
| hooks | `hooks/useGameSession.ts` (+ test) | one run over the engine: state, feed, previous meters, `play`, `chooseOption`, `restart` |
| hooks | `hooks/useRovingFocus.ts` | arrow keys move focus between the draft buttons |
| components | `GameBoard`, `MeterPanel`, `PhaseProgress`, `PhoneFeed`, `CardDraft`, `CardDetailDialog`, `EventDialog`, `GameEndDialog`, `PauseMenu` (+ `GameBoard.test.tsx`) | presentation only |
| api | `api/index.ts` | `GameBoard` |
| pages | `src/pages/GamePage.tsx` | passes `SEED_CONTENT`, quit → `/` |

Components never import services (ESLint): the hook returns the view.

## Pattern & precedent
Card-draft games (Reigns-like, Slay-the-Spire hands) play a card on tap and offer details on a separate affordance; drag is optional sugar. Event/ending modals that must be answered are standard non-dismissible dialogs (WAI-ARIA alertdialog-like: focus trapped, no close button).

## Phases
1. Types + services + tests (TDD). Gate: `pnpm -s exec vitest run src/features/game-board`.
2. Hook + acceptance test. Gate: same.
3. Components, Modal prop, page, route, Home link. Gate: type-check, lint, arch, structure, feature-size, tests.
4. Playwright play-test locally at 390 / 820 / 1280, keyboard-only; then on the preview.

## Cleanup
Remove "Het spel wordt nog gebouwd." on Home.
