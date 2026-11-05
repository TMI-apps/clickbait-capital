# Brief — Faster first load: fonts and unused sign-in code

Task: Faster first load: fonts and unused sign-in code · Lap: temp_job_first-load · Harness: v0.44.0

## Problem

Phone visitors wait ~3.4 s for first paint (Lighthouse mobile 79–81) because the Google Fonts stylesheet blocks rendering and supabase-js plus the auth code sit in the main chunk, although most visitors never sign in.

## Success check

On a production build, Lighthouse mobile performance is >= 90 on `/` and `/spel`, `dist/index.html` has no render-blocking third-party stylesheet, the initial JS chunk contains no `@supabase` code, and `pnpm validate:bundle-size` fails on the pre-lap build (185 KiB gzip) and passes on the new one.

## In scope

- Self-host Space Grotesk + Inter (latin WOFF2, variable, OFL 1.1 recorded), `font-display: swap`, preload the critical one; drop the Google Fonts link and its PWA runtime caches (woff2 is already in the precache glob).
- Load supabase-js on demand (`loadSupabase()`); load it at startup only when a stored session, OAuth return or recovery link needs it. Sign-in, Google OAuth, password reset and error reporting keep working.
- Main-chunk gzip budget as a script + pnpm script; CI wiring via the orchestrator (protected workflow).

## Out of scope

- Will NOT do: the anonymous-sign-in permission decision (own backlog task) — deferred.
- Will NOT do: splitting react-router / radix / tailwind-merge out of the main chunk — not needed for the goal.
- Will NOT touch: `src/features/game-*`, `src/features/app-update/` (its README still mentions the Google Fonts cache: handed to the orchestrator), `src/config/app-tasks.json`.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| shared/services supabaseService | module load → `createClient` → every caller `getSupabase()` | `loadSupabase()` / `onSupabaseLoaded()` / `hasPersistedAuthSession()` | ride — same single client, now async |
| features/auth | `AuthProvider` → `useAuth` init → `getSession` (+ anon sign-in) on every visit | `needsAuthAtStartup()` gate in `useAuth`; subscription via `onSupabaseLoaded` | ride |
| features/error-reporting | error → `sendToSupabase` → rpc | send awaits `loadSupabase()` | ride |
| pages/ResetPasswordPage | effect subscribes to `PASSWORD_RECOVERY` | awaits `loadSupabase()` | ride |
| theme (index.css, index.html, DOC_THEMING) | Google Fonts `<link>` | `@font-face` + `public/fonts/` | new files (whitelist approved) |
| build tooling (vite.config PWA, scripts/, package.json) | Google Fonts runtime caches; no budget | removed caches; `scripts/check-bundle-size.cjs` | new script |

## Size

S — five edges, all riding existing paths; no data or schema change.
Cut into laps: none.

## Plan (S)

1. Acceptance: Lighthouse script (3 runs, mobile) before/after on `vite preview`; `check-bundle-size` node tests (TDD) + run against the old and new build.
2. `supabaseService` lazy client + tests; migrate callers and their mocks; startup gate in `useAuth`.
3. Fonts: download latin subsets, OFL file, `@font-face`, preload (measure Space Grotesk vs Inter preload), drop Google Fonts link + runtime caches.
4. Budget script + `validate:bundle-size` + `test:classify` entry.
5. Docs: auth / error-reporting READMEs, DOC_THEMING, ARCHITECTURE + platform rule (rename `getSupabase` → `loadSupabase`, code-style F4), decision log.

## Decisions

DECISIONS.md D1…D5.
