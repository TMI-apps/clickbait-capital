# Launch audit — game-settings lap

Production build (`pnpm build` + `vite preview`), Chromium (Playwright), 2026-11-04.

## Accessibility (WCAG 2.2 AA, axe-core 4.10.2)

| Screen | Dark | Light |
|--------|------|-------|
| Start `/`, Hoe speel je, Instellingen | 0 violations | 0 violations |
| Phase intro, board, pause + settings | 0 | 0 |
| Event dialog, ending, results | 0 | 0 |
| Lighthouse mobile accessibility (`/`, `/spel`, `/instellingen`) | 100 | — |

Fixed in this lap: the segmented control's selected state was a dark accent on a dark card, readable only by text colour. Selected segments now use `bg-primary` / `primary-foreground`, and the game screens use 44 px segments (`size="lg"`). Segment groups are named by their visible label (`labelledBy`).
Not covered: axe's "incomplete" items (contrast over gradients/images) were not reviewed by hand; no screen-reader pass (VoiceOver/TalkBack).

## Keyboard play (1280 and 390 px, keyboard only)

Start → Hoe speel je → back → Instellingen (Licht, Donker) → back → Start spel → phase intro → 20–27 turns with Tab + arrows + Enter, including an event → ending → Bekijk je rapport → Opnieuw spelen → Menu → Instellingen → Uit → Terug → Verder. Every step was reachable, with a visible focus ring on buttons and cards. Console errors: none.

## Layout

390 / 820 / 1280 px, dark and light, on `/`, `/hoe-speel-je`, `/instellingen`, `/spel`: no horizontal scroll.

## States

Offline banner shows on disconnect and hides after 6 s. Offline + a not-yet-loaded page → "Je bent offline". Blocked chunk online → "Laden mislukt"; "Naar het begin" returns to the start screen. Missing `CSS.supports` → "Browser niet ondersteund" with home only.

## Performance (Lighthouse 12.8.2, mobile, simulated 4G; measured before the D7 fix, so main-chunk bytes were 14 kB gzip higher)

| Route | Perf | FCP | LCP | TBT | CLS | Transfer |
|-------|------|-----|-----|-----|-----|----------|
| `/` | 79 | 3.4 s | 3.7 s | 90 ms | 0.006 | 304 KiB |
| `/spel` | 81 | 3.5 s | 3.9 s | 50 ms | 0 | 334 KiB |
| `/instellingen` | 81 | 3.3 s | 3.5 s | 40 ms | 0 | 309 KiB |

Bundle: main chunk 635 kB / 191 kB gzip (main branch: 625 / 187); the +4 kB gzip is the eager app-status code and copy. A first build had 205 kB gzip because importing the game-content barrel from the main chunk pulled the whole deck in. app-status now imports the copy-only `@/features/game-content/api/copy` (D7). The new settings and rules pages are lazy chunks of 0.5 kB and 1.1 kB.

## Proposed backlog items (outside this lap)

1. **Render-blocking Google Fonts CSS** (about 0.9 s of FCP on mobile): self-host Inter + Space Grotesk (woff2 in `public/`, precached), or load the stylesheet without blocking render. Visual/FOUT trade-off; self-hosting may need a package (e.g. `@fontsource`).
2. **Supabase SDK and auth in the main chunk** (Lighthouse "unused JavaScript", about 125 KiB): players have no accounts, so `AuthProvider` / supabase-js could be loaded lazily for `/login` and `/auth/callback` only. Needs an auth-architecture decision.
3. **Main chunk over the 500 kB warning:** after 1–2, set a bundle budget in CI (e.g. main chunk ≤ 150 kB gzip).
4. **Manual screen-reader pass** on the board and event dialog (VoiceOver iOS, TalkBack).
5. **`app-update` README is missing a `## Dependencies` heading** (`pnpm validate:feature-docs:strict`).
6. Flaky in the sandbox only: the Google Fonts CSS request through the service worker sometimes fails (`ERR_FAILED`); it could not be reproduced on its own. Re-check on the Cloudflare preview.
