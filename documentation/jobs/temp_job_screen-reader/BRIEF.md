# Brief — Manual screen-reader pass

Task: Manual screen-reader pass · Lap: temp_job_screen-reader · Harness: v0.44.0

## Problem
A screen-reader player can start a run but cannot follow it: after every play focus drops to the page body, meter changes and goal progress are never spoken, card effects are not part of what a card says, and the update banner may never be announced.

## Findings (scripted 390px game, Playwright AX tree + live-region capture, before)
1. Focus lands on `<body>` after every card play, after every event answer and after "Aan de slag" (the focused element unmounts). VoiceOver/TalkBack restart at the top of the page each turn.
2. The only turn announcement is "Geplaatst: <titel>": no meter changes, no goal line (Bereik/Omzet), no danger, no Journalistieke Droogte start. Event answers announce the event title, not the chosen policy.
3. Card buttons: description computes to just "Effecten" (the effects list's `aria-label` wins over its content), so effects are never heard on a card. Event option buttons end their name in "Effecten" for the same reason.
4. Draft cards are announced as toggle buttons ("niet ingedrukt"): `aria-pressed="false"` is always set, though nothing is selectable.
5. Meter tiles read the value twice (visible number + `role="meter"`), and the danger icon says "Gevaar" next to a valuetext that already says "gevaarlijk laag". The change ("+8") is a separate unlabelled text.
6. Flow screens (phase intro, endings) focus the heading but the kicker ("Fase 2", "Game over") sits before it, so it is skipped; the phase-step dots are a list of four empty items.
7. Update banner: `role="status"` is mounted together with its text, which VoiceOver and TalkBack often don't announce; the buttons' text would also be read as part of the status.

## Success check
In a scripted full game at 390px, every turn produces exactly one polite announcement that names the post or chosen policy, each changed meter with direction and new value, and the goal line; focus never rests on `<body>` after a play, an event answer or a phase intro; card and event-option buttons expose their effects; and the update banner's text is announced by an always-mounted status region.

## In scope
- One turn announcement per action (pure service + hook; replaces "Geplaatst: …"), politeness `polite`, re-announced even when the text repeats.
- Focus: after a play → the card in the same draft slot; after an event answer → that slot; after the phase intro → the board heading.
- Kit: GameCard sets `aria-pressed` only when `selected` is given; GameCardEffects exposes effects as text (sr-only "Effecten:" prefix, unlabelled list).
- MeterPanel: one spoken element per meter (`role="meter"` with change in valuetext); visible duplicates `aria-hidden`.
- FlowScreen: kicker spoken as part of the focused heading; PhaseTransitionScreen dots hidden.
- UpdatePrompt: always-mounted status that holds only the text.

## Out of scope
- Will NOT do: real VoiceOver/TalkBack runs (owner test steps instead) — excluded (no device).
- Will NOT do: drag-and-drop alternatives (tap/Enter already plays) — excluded.
- Will NOT touch: visuals, copy of existing screens, game rules.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| game-board | play → `useGameSession` → new `BoardView` → `PlayingBoard` render + `aria-live` "Geplaatst" | `PlayingBoard`, `MeterPanel`, new `services/boardSpeech.ts` + `hooks/useBoardScreenReader.ts` | ride — replaces the existing live region |
| game-flow | `FlowScreen` focuses its heading; `EventModal` on Modal | `FlowScreen`, `PhaseTransitionScreen`, `EventModal` (focus return) | ride |
| components/common | GameCard, GameCardEffects, Modal | `aria-pressed`, effects text, Modal `onCloseAutoFocus` passthrough | ride |
| app-update | `UpdatePrompt` mounts `role=status` with text | `UpdatePrompt` | ride |

## Size
S — four edges, each a small change; one new pure service with tests.
Cut into laps: none

## Plan
1. Acceptance test (fails first): `boardSpeech.test.ts` — message for a card play, an event answer, an unchanged-meter turn, danger and drought start.
2. `services/boardSpeech.ts` (pure) + `hooks/useBoardScreenReader.ts` (live text keyed per release, queued while the event dialog is mounted, 150 ms after the focus move); wire in `PlayingBoard`, drop the old `<p aria-live>`.
3. Focus restore in `PlayingBoard` (slot ref, effect on draft, `onCloseAutoFocus` on EventModal → Modal passthrough), heading focus on mount (`PhaseProgress` h1 `tabIndex=-1`).
4. Kit: GameCard `aria-pressed`, GameCardEffects text; update GameCard tests.
5. MeterPanel valuetext with change; hide visual duplicates; update MeterPanel test.
6. FlowScreen kicker in heading; dots `aria-hidden`.
7. UpdatePrompt always-mounted status; test.
Gate: `pnpm test:run`, `type-check`, `lint`, `arch:check`, `validate:structure`; scripted game re-run with live-region log + AX snapshots (after).

## Decisions
DECISIONS.md D1–D4.
