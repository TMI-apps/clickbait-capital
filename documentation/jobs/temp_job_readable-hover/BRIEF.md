# Brief — Readable buttons, cleaner feed posts and event images

Task: owner bug "the events and button hover effect make the content unreadable" (via orchestrator) · Lap: temp_job_readable-hover · Harness: v0.45.0

## Problem

On hover/press the kit Button `outline` sweep (`bg-foreground-sweep`) fills the button with the foreground colour and flips text to `--background`; the event options' coloured content (meter icons, ± numbers, kind label) becomes unreadable, and on touch the hover sticks after a tap.

## Success check

In every state (rest, hover, press, focus) and both modes, event-option label, kind line and effect numbers keep their rest colours and reach WCAG AA (≥ 4.5:1) on the state's background; a tap leaves no hover; when a second event follows, its first option has focus.

## In scope

- New `interactive-tint` utility: primary tint background, primary border, soft primary glow (hover only behind `@media (hover: hover)`), stronger tint on `:active`, 0.98 press scale only without reduced motion. Never touches `color`.
- Tokens `interactive-tint`, `interactive-tint-strong`, `elevation-glow` (light + dark DTCG).
- Kit Button: `outline` uses `interactive-tint` (sweep removed); new `choice` variant for option lists (card surface, full width, left aligned, grows with content).
- EventModal options use `choice`; options keyed per event, first option focused when the next event replaces them.

- Added by the owner (via orchestrator) during the lap: feed posts (newest and compact) lose the type-coloured left bar (`border-l-4`); the type label stays.
- Added by the owner: the event dialog shows the event's photo above its title (card-imagery `getCardImage` + kit `GameCardArtwork`/ThumbnailFrame, via a new kit `Modal` `media` slot); fits 375×667 without page scroll, focus and screen-reader output unchanged.

## Out of scope

- Will NOT do: `bg-brand-gradient` (default variant) hover — it only shifts the gradient, text stays readable.
- Will NOT touch: ghost / secondary / destructive / link variants; Badge `outline`.

## Edges

| Feature area                                                                                                                                                              | Loop today                     | Hook point                | Ride / new                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------- | ------------------------------------- |
| components/common/Button                                                                                                                                                  | variant → classes              | `buttonVariants`          | ride — variant swap + one new variant |
| src/index.css + theme tokens                                                                                                                                              | `@utility bg-foreground-sweep` | replace utility           | ride                                  |
| game-flow EventModal                                                                                                                                                      | event → options → onChoose     | option list               | ride                                  |
| game-board PhoneFeed                                                                                                                                                      | played card → feed post        | post classes              | ride — remove side bar                |
| kit Modal + GameCardArtwork                                                                                                                                               | dialog / artwork               | `media` slot, `className` | ride — generic additions              |
| Outline consumers (game-board PauseMenu/PlayingBoard/CardDetailDialog, game-flow Results/Resume, game-settings, game-audio, app-status, auth, pages Home/Privacy/Credits) | outline buttons                | none (inherit)            | ride — visual check only              |

## Size

S — one kit utility + variant, tokens, one feature component, one focus fix; plus two small owner additions (feed side bar, event photo).
Cut into laps: none

## Plan (S)

1. Failing test: EventModal "should start the next event with fresh options and focus on the first when events follow each other" (red: same DOM buttons reused because option ids repeat).
2. Tokens → `pnpm tokens:build`; `interactive-tint` utility replaces the sweep; Button `outline` + `choice`.
3. EventModal: `choice`, `key={event.id}` on the fieldset, `autoFocus` on the first option.
4. Gates: type-check, lint, tests, structure/arch; Playwright 390×844 touch + 1280 mouse, dark + light, contrast ratios in hover/press.

## Decisions

DECISIONS.md D1–D4.
