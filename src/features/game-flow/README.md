# Game flow

The screens between board turns in Clickbait Capital: the event modal, the phase transition screens, the three game-over endings, the IPO victory and the results screen with the end report. Rules SSOT: `documentation/DOC_GAME_DESIGN.md` (§ 4 events, § 6 phases and the IPO end report).

## Purpose

- **Event modal:** one urgent situation with three actions (A/B/C, effects hidden); after a pick the dialog reveals the chosen action and its phase-scaled meter changes, and "Verder" applies it. It must be answered.
- **Phase transition:** a full-screen intro when a phase starts (De Zolderkamer → De Scale-Up → Wereldwijd Platform → De Beursgang): the phase's photo as hero, phase steps, intro, tip and the new goal.
- **Endings:** Bankroet, Verlaten Platform, Verbod & Regulering (newspaper headline, story, lesson — the story matching the run, picked by game-content's `selectGameOverText`) and the IPO (report title and its closing question). Dramatic in tone.
- **Results:** sober numbers: turns, phase reached, users, revenue, the end report lines (damage, misinformation, sleep, family fights, ads, factchecks, crises) and what went into the feed; "Opnieuw spelen", "Deel je resultaat" and "Naar het begin".
- No game rules and no copy here: texts come from `@/features/game-content/api`, numbers from the run summary the board passes.

## Structure

| Layer      | Path                                                                  | Purpose                                                                               |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                                                        | `EventModal`, `PhaseTransitionScreen`, `GameEndFlow`, `ResumeScreen`, `usePhaseIntro` |
| Components | `components/EventModal.tsx`                                           | Non-dismissible event dialog on the `Modal` kit                                       |
| Components | `components/FlowScreen.tsx`                                           | Full-screen layout: focused heading, optional hero photo, entrance motion, 44px actions |
| Components | `components/PhaseTransitionScreen.tsx`                                | Phase intro from `PHASE_INTROS` plus the goal and the phase photo                     |
| Components | `components/ResumeScreen.tsx`                                         | `/spel` with a saved run: "Verder spelen" / "Nieuw spel" (local-save D4)              |
| Components | `components/GameEndFlow.tsx`, `EndingScreen.tsx`, `ResultsScreen.tsx` | Ending → results                                                                      |
| Hooks      | `hooks/usePhaseIntro.ts`                                              | Which phase intro is still unseen in this run                                         |
| Hooks      | `hooks/useGameEndFlow.ts`                                             | Ending/results step and their views                                                   |
| Services   | `services/endFlow.ts`                                                 | Pure run summary → ending, results and share card (`buildEndReport`)                  |
| Types      | `types/gameFlow.types.ts`                                             | `FlowEvent`, `FlowPhase`, `RunSummary`, `EndingView`, `ResultsView`                   |

## Decisions

- **Screens replace the board (game-flow D1):** phase transitions, endings and results render instead of the board as a full-screen `<main>` whose heading takes focus on open; only the event stays a modal over the board, so the player sees the feed it interrupts.
- **When intros show (D2):** the phase 1 intro opens every run (`PHASE_INTROS` is "shown when the phase starts"); a transition always comes before a milestone event of the same turn; an ending wins over a pending transition. `usePhaseIntro.reset` is called with the board's restart. A resumed run passes the phase before its last action as seen, so it opens on the board unless that action started a new phase (local-save D5).
- **Report on a game over (D3):** the results reuse `buildEndReport` lines for every ending except the IPO valuation; the report intro shows only after a win, and the report title and closing question form the IPO ending screen.
- **Formatting stays in the board (D4):** the board formats the absolute stats (`statTexts`) with its nl-NL formatters and passes the raw numbers for `buildEndReport`, so no third formatter copy exists here.
- **Motion:** entrance fades use the motion tokens (`--duration-slow`), which drop to ~0 under prefers-reduced-motion. Bigger juice belongs to the game-juice lap.
- **Phase hero (phase-images D2, D3):** `PhaseTransitionScreen` passes card-imagery's `getPhaseImage(phaseId)` as `FlowScreen` `heroImage`. The photo fills the heading block (dots, kicker, title; `clamp(7rem, 28dvh, 15rem)` tall, full bleed on phones, rounded from `sm`), `object-fit: cover` around its focal point, with a gradient into the page background so the title stays readable. It has a Dutch alt, loads eagerly with `fetchpriority="high"` and disappears if it fails to load. At heights ≤ 480px every flow screen tightens its spacing and the hero shrinks to the text, so the intro fits without scrolling at 360×640, 390×844, 844×390 and 1440×900.
- **Not dismissible:** the event modal passes `dismissible={false}` (game-board D5); endings have no close, only their actions.
- **Spoken headings (screen-reader D5):** the kicker ("Fase 2", "Game over") is visually above the heading but spoken inside it (sr-only, followed by a space only when there is a kicker), since focus lands on the heading; the phase-step dots are `aria-hidden`. The results heading starts with sr-only "Je rapport." because a lost ending and its results share a title. The event modal takes `onCloseAutoFocus` so the board can return focus to the draft.
- **Share card (game-flow D5, share-card lap):** `toShareCardContent` fills the result-share card from the run: the ending's kicker, title and headline (the IPO closing question on a win), phase reached, Hoogste bereik, Totale omzet, `shareText` and the production link (`SITE_ORIGIN`). `SHARE_RESULT_COPY` maps the share outcomes to `UI_COPY.results` status lines. The button sits between the two results actions on both outcomes.
- **Event options (readable-hover D1–D3):** each option is a kit `Button` `choice` (card surface; hover/press tint the background and light the border, never the text), so text stays readable. The option list is keyed per event: events reuse option ids, and a following event must get fresh buttons with focus on its first option. The event's photo (`getCardImage(event.id)` in the kit `GameCardArtwork`, passed through the `Modal` `media` slot) sits above the title as a banner (size: event-redesign D4); it is `aria-hidden`, so the dialog reads as before (readable-hover D6).
- **Hidden effects, outcome reveal (event-redesign D1–D4):** options show a position letter (A/B/C in the shown order, which the board shuffles per run and event: event-redesign D5; `aria-hidden`) and the action only: no meter icons, numbers or kind label. A tap keeps the dialog open and swaps the options for the outcome ("Je koos", the label, `GameCardEffects` of the option's scaled effects) with a focused "Verder" that is `aria-describedby` the outcome; `onChoose` fires on "Verder", so the engine, the board's meter juice and its turn announcement run unchanged after the dialog closes. Entrance uses `motion-safe:` + `--duration-normal`. Fit: banner `clamp(4rem, 15dvh, 8rem)`, dialog `p-4 gap-3`, `choice` is a row (letter + label) — no scroll at 360×640, 375×667, 390×844.
- **Outcome juice (event-juice-drop D1–D2):** the outcome's effect rows play the card juice of the option's kind through game-juice `EffectsJuice` (kit `GameCardEffects` with its `decorate` slot): the rows pop in, the numbers count up from 0, and each row flashes gain / loss with the kind's accent (engagement → flames, commercial → gold, journalism → shield only, no flash). Decorative only: the description "Verder" reads stays the plain effects. Reduced motion snaps.
- **Report button copy:** `UI_COPY.results.reportButton` ("Bekijk je rapport"), added to game-content in this lap with the orchestrator's approval.
- **Glossary words (kids-content D3):** `EventModal` (event body), `PhaseTransitionScreen` (body, tip), `EndingScreen` (body, lesson) and `ResultsScreen` (report intro) render text through the kit's `GlossaryText` with `GLOSSARY`. Titles, headlines, option labels and the share card use fields without markup.

## Not here yet

Juice and sounds on these screens (game-juice, game-audio).

## Testing

Colocated Vitest: `services/endFlow.test.ts` (ending, results and share card views), `components/GameEndFlow.test.tsx` (share button on won and lost results), `hooks/usePhaseIntro.test.ts`, `components/EventModal.test.tsx`; the board's `GameBoard.test.tsx` covers the integration (intro at start, milestone transition, ending → results → restart). Browser play-tests with Playwright at 390 / 820 / 1280px (see the lap's PR).

## Dependencies

- `@/features/game-content/api` (`PHASE_INTROS`, `selectGameOverText` for the ending story, `GAME_OVER_TEXTS` titles for the results, `buildEndReport`, `UI_COPY`).
- `@/features/result-share/api` (`ShareResultButton`, card types) and `@/config/site` (`SITE_ORIGIN`).
- `@/features/card-imagery/api` (`getCardImage` for the event photo, `getPhaseImage` for the phase hero).
- `@/features/game-juice/api` (`EffectsJuice`, `juiceActionForEvent` for the outcome reveal).
- Kit: `Modal`, `Button`, `GameCardArtwork`. Icons: `lucide-react`.
- Used by `@/features/game-board` (`GameBoard`), which maps engine state to these types.
