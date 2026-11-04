# Brief — Installable app and offline play

Task: "Installable app and offline play" (`src/config/app-tasks.json`) · Lap: temp_job_installable-app · Harness: v0.44.0 · Branch `feat/installable-app` (Model C).

## Problem

Players (students in class, often on flaky school wifi) can't install Clickbait Capital to the home screen as an app or replay it without a connection.

## Success check

After one online visit to `/spel`, a production build served with the network cut reloads `/spel` and shows the board; Chrome reports the app installable; a second build with changed assets shows "Nieuwe versie beschikbaar · Herladen" and reloading activates the new version.

## In scope

- Service worker (production builds only): precache the app shell (hashed Vite assets, `index.html`, icons, manifest), `public/audio/*.mp3`; runtime cache-first for `/cards/*` (future images) and Google Fonts; SPA navigation fallback to `index.html`.
- Never handled by the SW: `/__dev*`, `/api*`, Supabase and any other cross-origin call except Google Fonts.
- Update flow: new SW waits; a small Dutch prompt offers "Herladen" (activates + reloads); otherwise it activates on the next full load after all tabs close.
- `public/manifest.json`: `start_url` `/spel`, `id`, `scope`, maskable icon purpose where valid.

## Out of scope

- Will NOT do: offline-state screen / "you're offline" UI (game-settings lap), custom install button (browser prompt is enough), push notifications, background sync.
- Will NOT touch: game-board, game-flow, game-content, game-audio, `src/config/app-tasks.json`.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| Build (`vite.config.ts`) | Vite build → `dist/` → Workers static assets | plugin list | ride — add PWA plugin (pending dependency answer) |
| `src/App.tsx` | providers + routes | render `<UpdatePrompt />` once | ride |
| `src/features/app-update/` | Not found | new feature: SW registration hook + prompt | new — one concept (app version lifecycle) |
| `public/manifest.json` | linked from `index.html` | fields | ride |

## Size

S — one new small feature, build config, manifest tweaks. Cut into laps: none.

## Decisions

See `DECISIONS.md`.
