# BRIEF — app-update-flow

Task: "Make app updates noticeable" (`src/config/app-tasks.json`). Size **S**. Branch `feat/app-update-flow` (Model C). Orchestrated thread; owner decisions relayed by the orchestrator.

## Problem

The owner opened the installed app after several deploys and still saw the old version (no card images). The service worker installs a new deploy in the background and waits (`registerType: "prompt"`); the only way in was a small "Nieuwe versie beschikbaar" banner, easy to miss or dismiss, and a waiting worker only takes over once every tab of the app is closed — an installed PWA on a phone rarely is. The browser also only looks for a new `sw.js` on a full navigation, so an app resumed from the background never even notices a deploy.

## Success check

- A returning visitor whose cached app is older than the deploy ends up on the new version **without a tap**, as long as they have not started playing: the update applies on app start before the first input, and on any route change (start screen, settings, a new game).
- During a game (player has interacted, still on the same route) the game is never reloaded without a tap: a slim Dutch banner ("Nieuwe versie klaar. Laadt na dit spel.") offers **Nu laden** and a close (Later).
- The app checks for a new deploy when it comes back to the foreground and every hour while open.
- Proved with Playwright on two local builds (`dist` v1 → v2): fresh visit → v2 loads by itself; mid-game (after input) → banner, game state kept; navigate to the start screen → v2.

## In scope

`src/features/app-update/` (hooks, services, component, README), `UpdatePrompt` copy, `documentation/DOC_DECISION_LOG.md` at ship.

## Out of scope

`vite.config.ts` PWA options (prompt mode stays — see D1), game-board / game-flow (no saved-run feature), `src/config/app-tasks.json`, `index.html`.

## Touched edges

`react-router-dom` `useLocation` (the prompt is already mounted inside `BrowserRouter` in `App.tsx`); no other feature.

## Plan (S, inline)

0. **Acceptance test first:** `hooks/useSafeUpdateMoment.test.tsx` — applies when ready before any input; does not apply after input on the same route; applies on the next route change; nothing when no update. Red before the hook exists. Plus the Playwright two-build script (scratch, results in the PR).
1. `services/updateChecks.ts` (+ test): `watchForUpdates(registration)` → `registration.update()` on `visibilitychange` → visible and every 60 min.
2. `hooks/useSafeUpdateMoment.ts`; wire both into `useAppUpdate` (`onRegisteredSW`), clearer prompt copy.
3. README (policy + decisions), gates (`lint`, `type-check`, `test:run`, `arch:check`, `validate:*`, `build`), Playwright run.
