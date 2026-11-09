# Brief — "Nu laden" on the update banner does nothing

Task: owner bug report via orchestrator · Lap: temp_job_update-reload · Branch: fix/update-reload

## Problem

"On a new update the button with 'new version, reload' doesn't work." Production, device unknown.

## Root cause (proven, two-build Playwright reproduction)

`applyUpdate` called the plugin's `updateServiceWorker(true)`, which posts SKIP_WAITING to `registration.waiting` and relies on Workbox's `controlling` event (`controllerchange`) to reload. When the page is **not controlled** by a service worker — first visit before any reload, or after a hard reload — the generated `sw.js` doesn't call `clients.claim()`, so the new deploy's worker activates at once instead of waiting. `registration.waiting` is `null`, no message is sent, `controllerchange` never fires: no reload, banner stays. When the update is found more than 60 s after registration Workbox marks it "external" and shows the banner (`onNeedRefresh`).

Observed before the fix (v1 `index-B92Q14k2.js` → v2 `index-RwunCaey.js`):

| Scenario | Registration at banner | After **Nu laden** |
| --- | --- | --- |
| First visit, update via `visibilitychange` | `waiting: false`, active `activating`, `controller: false` | no reload, v1, banner still visible |
| Hard reload + 65 s, update via `visibilitychange` | same | no reload, v1, banner still visible |
| Controlled (after one reload), with and without 65 s | `waiting: true`, `controller: true` | `controllerchange`, reload into v2 |

Ruled out: `sw.js` handles SKIP_WAITING (`self.addEventListener("message", … self.skipWaiting())`); production `sw.js` and `/spel` are `cache-control: public, max-age=0, must-revalidate` (curl); the click handler is reached (banner rendered from `needRefresh`).

## Success check

Same two-build reproduction: every scenario above reloads into v2 after **Nu laden**; with no input the D1 auto-apply also lands on v2.

## Scope

In: `useAppUpdate.applyUpdate`, new `services/workerActivation.ts` + test, app-update README (D4). Out: update policy D1/D2 (kept), `vite.config.ts`, the silent case where an uncontrolled page finds the update within 60 s of registration (Workbox reports it as offline-ready, no banner; the next navigation loads it).

## Size

XS — one hook callback, one small service.

## Plan (XS)

1. Failing test: `workerActivation.test.ts` (no waiting → resolves; waiting → SKIP_WAITING, resolves on `activated` / `redundant` only).
2. `activateWaitingWorker(registration)`; `applyUpdate` = activate, then `window.location.reload()`; drop `updateServiceWorker`.
3. README D4; re-run the reproduction.

Precedent: Workbox's "offer a page reload" recipe (`messageSkipWaiting` + reload on `controlling`) assumes a controlled page; waiting on the worker's own `statechange` covers both. No package: a few lines on the platform API.

## Decisions

DECISIONS.md D1–D2
