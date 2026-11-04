# Decisions — game-card

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | Card types and meters are kit variants (`type`, `meter` unions) with default Dutch label + lucide icon, overridable by props | Caller passes raw colours/icons | Colour must always ship with icon + label; one place keeps that pairing; still no feature import |
| D2 | Interactive card renders as `<button aria-pressed>` when `onSelect` is given, else `<article>` | Wrapper with nested button | One tab stop, native keyboard (Enter/Space), selected state announced |
| D3 | Deltas are signed numbers with arrow + meter icon + meter name (sr-only "omhoog/omlaag") | `+++` glyph strings | Engine gives numbers; text keeps meaning without colour |
| D4 | Rarity `common`/`rare`/`legendary` (Gewoon/Zeldzaam/Legendarisch); common shows no badge | No rarity | Task asks for rarity states; GDD has none yet, so kept presentational only |
| D5 | States gallery is a test-only fixture + Playwright screenshots; no route | Dev route in `src/pages` | `src/pages` is out of scope for this thread (asked orchestrator) |
| D6 | Focus = foreground outline (offset 4px); selected = primary ring + lift + "Gekozen" badge | Same ring for both | Keyboard users must tell focus from selection; seen in browser at 390px |
| D7 | Frame border via `game-card-frame` utility, not `border-game-card` | `border-*` name | Tailwind resolved `border-game-card` as a colour utility (width stayed 0, found in browser) |
| D8 | No orchestrator answer on a preview route yet → option B (screenshots only); a route can follow in the game-board lap | Wait | Keep the lap moving; `GameCardGallery` is ready to mount |
