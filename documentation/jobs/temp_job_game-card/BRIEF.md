# Brief — Card frame, game tokens and GameCard kit component

Task: Card frame, game tokens and GameCard kit component · Lap: temp_job_game-card · Harness: v0.44.0

## Problem
The game board lap needs one accessible, themed card to show Viraal / Advertentie / Nieuws / event cards, and the theme has no game tokens yet.

## Success check
`GameCard` renders every type (viraal, advertentie, nieuws, gebeurtenis) with an icon + Dutch text label, signed meter effects with meter icons and text, selected / disabled / focus states as a keyboard-operable ≥44px button, an image with focal point and a fallback, and the token contract test passes with the new game tokens in light, dark and reduced motion.

## In scope
- DTCG tokens: card frame (radius, border width, image aspect ratio), card-type colours (+ foregrounds) per type, meter colours, card draw/play motion with reduced-motion overrides; `pnpm tokens:build`; `THEME_TOKENS` + contract test updated; Tailwind mapping in `src/index.css`; `DOC_THEMING.md` token table.
- `src/components/common/GameCard/`: presentation-only kit component with generic props (data in, `onSelect` out), type + rarity variants, stat rows, image focal point + fallback, states, motion utility classes.
- A test-only states gallery (fixture rendered by tests) + Playwright screenshots at 390px, tablet and desktop, light and dark.

## Out of scope
- Will NOT do: game logic, drag-to-feed, the juice effects themselves (confetti, coin rain, shake) — game-board lap.
- Will NOT touch: `src/features/**`, `src/pages/**`, `src/config/app-tasks.json`.
- Will NOT add: Storybook or any new dependency.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `src/shared/theme/tokens/` + `themeTokens.ts` + `src/index.css` | DTCG → tz build → generated CSS → `@theme inline` | new token groups `game-card`, `card-type`, `meter`, motion | ride — documented "new color" path |
| `src/components/common/GameCard/` | Not found | new kit component | new |
| `documentation/DOC_THEMING.md` | token table | new rows | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size
M — tokens across three files + contract, a new kit component with many states, docs and browser screenshots.
Cut into laps: none.

## Decisions
DECISIONS.md D1…Dn.
