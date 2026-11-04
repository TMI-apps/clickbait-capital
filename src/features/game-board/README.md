# Game board

The playable board of Clickbait Capital at `/spel`: one run of the core loop over the rules engine. Rules SSOT: `documentation/DOC_GAME_DESIGN.md`; engine: `src/features/game-engine/README.md`.

## Purpose

- Shows the three meters (Inkomsten, Gebruikers, Reputatie), the phase with its milestone progress, the central phone feed and the 3-card draft.
- Lets the player feed a card by tap, drag onto the feed, or keyboard (arrow keys + Enter / Space), answer pending events, see the end of a run, open card details and pause.
- No game rules here: `useGameSession` calls the engine and keeps only UI history (feed, meters before the last action).

## Structure

| Layer      | Path                                                                                       | Purpose                                                                         |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| API        | `api/index.ts`                                                                             | `GameBoard` (props: `content`, `onQuit`, optional `seed`)                       |
| Components | `components/GameBoard.tsx`                                                                 | Composition: header, meters, feed, draft, dialogs, drag context                 |
| Components | `components/MeterPanel.tsx`, `PhaseProgress.tsx`, `PhoneFeed.tsx`, `CardDraft.tsx`         | Board parts (presentation)                                                      |
| Components | `components/CardDetailDialog.tsx`, `PauseMenu.tsx`                                         | Dialogs on the `Modal` kit                                                      |
| Hooks      | `hooks/useGameSession.ts`                                                                  | One run: engine state, feed, `play`, `chooseOption`, `restart`, the `BoardView` |
| Hooks      | `hooks/useRovingFocus.ts`                                                                  | Arrow keys move focus within a group of buttons                                 |
| Services   | `services/boardView.ts`                                                                    | Pure engine state → view mappers; run summary for the end screens; formatting   |
| Types      | `types/gameBoard.types.ts`                                                                 | View models (`BoardView`, `MeterView`, `DraftCardView`, `FeedEntry`, …)         |

## Decisions

- **Content is input (game-board D1, D9):** `GameBoard` takes a `GameContent`; `src/pages/GamePage.tsx` passes `GAME_CONTENT` from game-content. A card's optional `flavor` field (game-content D2) shows in the detail view. Player copy comes from `UI_COPY`; end texts are game-flow's.
- **Scaled numbers (D10):** draft cards and event options show effects after the engine's `scaleForPhase` (e.g. reputation loss ×2 in phase 3), so the number shown is the number applied. Turn modifiers (Ad-Fatigue, Echo-Chamber) are not previewed. Event options reuse the kit's `GameCardEffects`.
- **Tap plays (D2):** one tap or Enter / Space plays the card; details sit behind the info button on the artwork (accessible, unlike long-press).
- **Drag (D3):** `@dnd-kit/core` with a mouse distance (8px) and touch delay (150ms) sensor, so tap and drag coexist; dropping on the feed plays the card. No keyboard drag sensor: the keyboard path is arrows + Enter.
- **Fullscreen (D4):** `/spel` hides the Topbar (`FULLSCREEN_ROUTES` in `src/App.tsx`); quitting goes through the pause menu.
- **Answer-only dialogs (D5):** events and the end screen use `Modal` with `dismissible={false}` (no close button, Escape and overlay ignored); the pause and detail dialogs pass `closeLabel="Sluiten"` (the kit default stays "Close").
- **Droogte (D6):** during Journalistieke Droogte the viral card gets a destructive ring and warning icon, and a text line above the draft explains it (colour is never the only signal).
- **Compact cards (D7, D8):** the three cards stay in one row at 390px using `GameCard size="compact"` at every width; the flavor text and full labels are in the detail dialog.
- **Meter change:** the delta chip shows the change since the previous action including passive costs, not the card's printed effect.
- **Stats only as goal progress (D11):** the absolute stats (engine D1) show only for the goal conditions that read them, as "Bereik: x / doel" and "Omzet: x / doel"; "Bereik" keeps reach apart from the Gebruikers meter, whose number differs. Phase 4 (meter goal) shows none. The end screen labels them the same way.
- **Milestone progress:** the weakest goal condition as a ratio (stat / target, meter / threshold), plus "x/N beurten op rij" when the goal needs a streak.
- **Game-flow screens (game-flow D1, D2):** events open the game-flow `EventModal` over the board (the board keeps the last event while it animates closed); phase intros and the endings replace the board (`PhaseTransitionScreen`, `GameEndFlow`). The board's `toGameEnd` gives the run summary (engine numbers plus board-formatted stat texts, game-flow D4); restart also resets the phase intros.

## Not here yet

Juice effects (game-juice lap), settings in the pause menu (game-settings lap).

## Testing

Colocated Vitest: `services/boardView.test.ts` (mappers), `hooks/useGameSession.test.ts` (acceptance: a scripted player reaches an end; restart), `components/GameBoard.test.tsx` (phase 1 intro, tap, arrows + Enter, details, event modal, milestone transition, ending → results → restart, pause). Browser play-tests with Playwright at 390 / 820 / 1280px (see the lap's PR).

## Dependencies

- `@/features/game-engine/api` (engine functions, `scaleForPhase`, content and state types).
- `@/features/game-content/api` (`UI_COPY`, `fillTemplate`); the page passes `GAME_CONTENT`.
- `@/features/game-flow/api` (`EventModal`, `PhaseTransitionScreen`, `GameEndFlow`, `usePhaseIntro`).
- Kit: `GameCard`, `Modal`, `Button`. Package: `@dnd-kit/core` (already used by the tasks feature).
