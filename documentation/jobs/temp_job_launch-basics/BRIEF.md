# Brief — Launch basics: privacy note and SEO

Task: Launch basics: privacy note and SEO · Lap: temp_job_launch-basics · Branch: feat/launch-basics

## Problem

The public launch has no privacy statement (the sign-in panel links a placeholder `example.com/privacy`), and search engines get no `robots.txt`, no sitemap and no canonical URL: `/robots.txt` and `/sitemap.xml` on production return the SPA's `index.html` (`text/html`).

## Success check

- `/privacy` renders a short Dutch note at 390px, linked from the start screen and `/credits`; every claim matches the code (storage keys, PWA cache, error reporting only when Supabase is configured).
- `/robots.txt` is served as `text/plain` and points at the sitemap; the sitemap lists exactly `/`, `/spel`, `/hoe-speel-je`, `/instellingen`, `/credits`, `/privacy` on the production origin (no `/login`, `/reset-password`, `/auth/callback`, `/tasks`).
- Each public route renders one `<link rel="canonical">` with its production URL; hidden routes render none.
- `pnpm validate:bundle-size` stays under budget (privacy page lazy-loaded).

## What the app really stores or sends (audited)

| What | Where | When |
|---|---|---|
| `color-mode` | localStorage | colour-mode choice |
| `clickbait-capital:audio-muted`, `clickbait-capital:motion` | localStorage | settings |
| app files + card images | service-worker caches (`vite-plugin-pwa`) | production build |
| `sb-*-auth-token*`, `auth_redirect_path`, PKCE guard | localStorage / sessionStorage | only via hidden `/login` |
| error report (message, stack, page URL without query, user agent) → `upsert_error_log` | Supabase | only when `isSupabaseConfigured()`; production bundle has no Supabase URL today |

No cookies, no analytics, no third-party requests (fonts self-hosted).

## In scope

- `src/pages/PrivacyPage.tsx` (lazy route `/privacy` in `MainLayout`), copy in `UI_COPY.privacy`, links from the start screen and `/credits`; `PRIVACY_URL` → `/privacy`.
- `public/robots.txt`, `public/sitemap.txt` (plain-text sitemap: `*.xml` is not whitelisted in `public/`; orchestrator chose txt over a protected edit, D2).
- `src/config/site.ts`: production origin + public paths (SSOT for canonical and the sitemap test); canonical `<link>` via React 19 head hoisting.

## Out of scope

- Will NOT do: terms page (`TERMS_URL` stays a placeholder), per-route titles/descriptions, cookie banner (no cookies).
- Will NOT touch: `src/config/app-tasks*.json`, game features.

## Edges

| Feature area | Hook point | Ride / new |
|---|---|---|
| App routes (`App.tsx`) | lazy route + canonical link | ride |
| pages Home / Credits | link to `/privacy` | ride |
| game-content `UI_COPY` | `privacy` group | ride |
| `public/` | robots + sitemap | new files |

## Size

XS — static page, two static files, one config module.

## Plan (XS)

1. Acceptance: `site.test.ts` (sitemap ↔ `PUBLIC_PATHS`, robots sitemap line), `PrivacyPage.test.tsx` (claims, error-report line conditional), Home/Credits link assertions.
2. Copy + page + route + links + canonical.
3. robots.txt + sitemap.txt.
4. Checks, Playwright at 390px on the preview, decision log.

## Decisions

DECISIONS.md.
