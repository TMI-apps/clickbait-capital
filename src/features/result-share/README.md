# Result share

Turns a finished Clickbait Capital run into something a player can send: a generated share card (PNG) plus the game link, through the browser's share sheet, or a download and a copied link where there is none. No tracking, no server: everything happens on the device.

## Purpose

- **Share card:** a 1080×1350 PNG drawn on a canvas: gradient band with the brand, kicker and ending title, the punchy line (ending headline or IPO closing question), a stats panel and the link. Colors come from the computed design tokens, fonts are the self-hosted Space Grotesk / Inter (`public/fonts`).
- **Share strategy:** Web Share API with the image when `navigator.canShare({ files })` allows it, else `share({ title, text, url })`, else download the PNG and copy text plus link (MDN: `Navigator.share()`, `Navigator.canShare()`).
- **Button:** `ShareResultButton` with a polite `role="status"` line that says what happened.
- No game copy here: the caller passes the card content and the button/status copy (`ShareCardContent`, `ShareResultCopy`); game-flow fills them from the run and `UI_COPY`.

## Structure

| Layer      | Path                               | Purpose                                                                   |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------- |
| API        | `api/index.ts`                     | `ShareResultButton`, types                                                |
| Components | `components/ShareResultButton.tsx` | Button + status line                                                      |
| Hooks      | `hooks/useResultShare.ts`          | Pre-renders the card on mount (lazy `import()`), runs the share on tap    |
| Services   | `services/shareResult.ts`          | Share strategy with an injected browser environment; real environment     |
| Services   | `services/shareCardImage.ts`       | Canvas renderer → PNG blob (loaded on demand only)                        |
| Services   | `services/shareCardLayout.ts`      | Pure word wrap with ellipsis for canvas text, printable URL               |
| Types      | `types/resultShare.types.ts`       | `ShareCardContent`, `ShareOutcome`, `ShareEnvironment`, `ShareResultCopy` |

## Decisions

- **Hand-written canvas renderer (result-share D1):** one fixed card, so no package; html-to-image / html2canvas (DOM snapshot, font and CORS quirks, extra KiB) and satori (wasm, font buffers) were rejected.
- **Share order (D2):** file share → link share → download + copy. Closing the share sheet (`AbortError`) is silent; any other refusal (e.g. `NotAllowedError` after lost user activation) falls back to download and copy, which can then also end as "failed" when the browser wants activation for the clipboard; the status line says so.
- **Pre-render on mount (D3):** the image renders when the results open, so the tap calls `navigator.share` within the user activation (Safari refuses a share that starts after a long await). If the image is not ready or failed, text and link are still shared.
- **Theme colors (D4):** read from the computed tokens when the results screen opens (the pre-render), so the card follows the theme active at that moment; no hex values in the renderer.
- **Link (D5):** the caller passes the production link (`SITE_ORIGIN`), also from previews.
- **Bundle:** `shareCardImage.ts` is reached only through `import()` in the hook, so it stays out of the main chunk and the board chunk (`pnpm validate:bundle-size`).
- **Motion:** nothing animates here; the status line has no transition. `onOutcome` reports each finished attempt with the button, so the caller can play feedback on it (game-flow plays `share.done`, juice-wiring-flow D6) without this feature knowing about juice.
- **Busy state:** `aria-disabled` plus a guard in the hook, not `disabled`, so keyboard focus stays on the button while the share sheet is open.
- **Old browsers:** without `ctx.roundRect` the stats panel is square; if rendering fails entirely, text and link are still shared.

## Testing

Colocated Vitest: `services/shareResult.test.ts` (every share path with a fake environment), `services/shareCardLayout.test.ts` (wrapping), `components/ShareResultButton.test.tsx` (status after fallback and file share; renderer mocked, jsdom has no canvas). The real canvas is checked with Playwright on the preview (see the lap's PR).

## Dependencies

- Kit: `Button`. Icons: `lucide-react` (`Share2`).
- Used by `@/features/game-flow` (`ResultsScreen`).
