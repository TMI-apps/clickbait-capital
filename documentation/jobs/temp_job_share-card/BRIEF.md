# Brief — Share card with score

Task: Proposed: Share card with score · Lap: temp_job_share-card · Harness: v0.45.0

## Problem

A player who finishes a run (IPO or game over) has no way to show the outcome to friends, so the game does not spread.

## Success check

On the results screen of a won and a lost run, a "Deel je resultaat" button shares a generated PNG (ending title, phase reached, Hoogste bereik, Totale omzet, the ending headline, the game link) through `navigator.share({ files })`; without file sharing it falls back to `share({ text, url })`, and without `navigator.share` it downloads the PNG and copies text + link, each path ending in a spoken status message.

## In scope

- New feature `result-share`: pure card model + text wrapping, a hand-written canvas renderer (lazy `import()`, fonts from `public/fonts` via `document.fonts.load`, colors from the computed design tokens), the share strategy (file share → link share → download + copy), a `useResultShare` hook and a `ShareResultButton` with a polite status region.
- game-flow: `toShareCardContent(summary)` in `services/endFlow.ts`, the button on `ResultsScreen` (both outcomes).
- game-content: Dutch status copy in `UI_COPY.results` (button label `shareButton` and `shareText` already exist).
- Image pre-rendered when the results screen opens, so the click calls `navigator.share` inside the user gesture.

## Out of scope

- Will NOT do: tracking, a server, share counts, OG images per run, a custom share sheet — excluded.
- Will NOT touch: game-board / session state (parallel save/resume lap), the ending screen, the start screen.

## Edges

| Feature area | Loop today                                                                   | Hook point                                                                                 | Ride / new                                                               |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| result-share | Not found                                                                    | `ShareResultButton` via `@/features/result-share/api`                                      | new — one bounded concept: turn an outcome into a shareable image + link |
| game-flow    | `GameEndFlow` → `ResultsScreen` renders `ResultsView`                        | `useGameEndFlow` adds the share content; `ResultsScreen` renders the button in its actions | ride                                                                     |
| game-content | `UI_COPY.results.shareButton` / `shareText` / `shareCopied` reserved, unused | add status / file-name / card-footer copy                                                  | ride                                                                     |
| config       | `SITE_ORIGIN` (production origin)                                            | share link = `${SITE_ORIGIN}/`                                                             | ride                                                                     |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one new small feature, one screen, copy; no data, no dependency.
Cut into laps: none

## Decisions

DECISIONS.md D1–D5.

## Plan

**Conflict & compliance.** Placement: `src/features/result-share/{api,components,hooks,services,types}/` + `README.md` (flat feature, whitelisted pattern; 9 files, under budget). Layers: component → hook → services → types; the renderer is a plain service that uses `document` / canvas directly (no React; verified in the browser, not in jsdom); the share strategy takes an injected browser environment so it is unit-testable. game-flow imports only `@/features/result-share/api`. No dependency (D1, spec-reuse-package). No data, no auth, no server, no tracking. Performance: renderer and fonts load by dynamic `import()` from the hook, so neither the main chunk nor the board pays for it (`pnpm validate:bundle-size`). READMEs: new `result-share/README.md`; game-flow (button now shipped, drop "Not here yet" line); game-content (new copy keys). Testing: TDD for the pure parts (card model, line wrapping, share strategy with an injected navigator); component test for the button status; Playwright at 390px on the preview for the real canvas.

**Acceptance test (fails first):** `src/features/result-share/services/shareResult.test.ts` — "should share the image file when the browser can share files", "should share text and link when files are not supported", "should download the image and copy the link when navigator.share is missing".

1. **Pure core** — `types/resultShare.types.ts` (`ShareCardContent`, `ShareOutcome`), `services/shareCardLayout.ts` (`wrapText`, `toDisplayUrl`), `services/shareResult.ts` (`shareResult({ content, image, env })` → `"shared" | "shared-link" | "downloaded-and-copied" | "downloaded" | "copied" | "cancelled" | "failed"`). Gate: unit tests green, `pnpm type-check`.
2. **Renderer** — `services/shareCardImage.ts`: `renderShareCard(content)` → PNG `Blob` (1080×1350, tokens via `getComputedStyle`, `document.fonts.load` for Space Grotesk/Inter). Gate: type-check, lint.
3. **Hook + button** — `hooks/useResultShare.ts` (pre-render on mount via `import()`, click → `shareResult`, status text), `components/ShareResultButton.tsx` (Button + `role="status"` region), `api/index.ts`, README. Gate: component test, lint, arch:check.
4. **Wire-up** — game-content copy; game-flow `toShareCardContent(summary)` + `useGameEndFlow` + `ResultsScreen`. Gate: endFlow test, full `pnpm test:run`, build + `validate:bundle-size`.
5. **Browser** — Playwright 390px: won + lost results show the button; render the image and screenshot it; stub `navigator.share` away → download + clipboard + status. Gate: screenshots saved.

Progress: 1 Done · 2 Done · 3 Done · 4 Done · 5 Done (local `pnpm preview` build at 390px: won + lost results, file share, no-share fallback; preview URL re-checked after push)
