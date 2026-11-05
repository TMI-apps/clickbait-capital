# App status

App-level error, offline and unsupported-browser states for Clickbait Capital, mounted once in `src/App.tsx`.

## Purpose

- **Offline banner** (`OfflineBanner`): the app plays offline (`src/features/app-update/`), so losing the connection only shows a short, non-blocking notice at the top ("Je bent offline. Het spel werkt gewoon door.") that hides after 6 s; `role="status"`.
- **Laden mislukt** / **Je bent offline** (`AppErrorFallback`): fallback of the app's `QueryErrorBoundary` — a failed lazy chunk or a render error. Offline at that moment → the offline screen, otherwise "Laden mislukt". Both offer **Opnieuw proberen** (reload) and **Naar het begin** (hard navigation to `/`).
- **Browser niet ondersteund** (`BrowserSupportGate`): checked once per load (`isBrowserSupported`: ES2020 built-ins, `matchMedia`, `localStorage`, CSS grid); offers **Naar het begin** and a browser tip.
- Copy: `UI_COPY.appStatus` from `@/features/game-content/api/copy` (copy-only entry, so the card deck stays out of the main chunk; game-settings D7).

## Structure

| Layer      | Path                                                                             | Purpose                                                                                       |
| ---------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                                                                   | `AppErrorFallback`, `AppStatusScreen`, `BrowserSupportGate`, `OfflineBanner`, `AppStatusKind` |
| Components | `components/AppStatusScreen.tsx`                                                 | One full-screen state per `kind` (`offline`, `loadFailed`, `unsupported`), `role="alert"`     |
| Components | `components/AppErrorFallback.tsx`, `BrowserSupportGate.tsx`, `OfflineBanner.tsx` | Wiring of the screen to the boundary, the support check and the connection                    |
| Hooks      | `hooks/useOnlineStatus.ts`                                                       | `navigator.onLine` via `useSyncExternalStore`                                                 |
| Hooks      | `hooks/useAppStatusActions.ts`                                                   | `retry` / `goHome` actions; `useBrowserSupported`                                             |
| Services   | `services/browserSupport.ts`, `services/appNavigation.ts`                        | Feature check (injectable env); reload and home                                               |

## Decisions

- **Offline does not block play (D6 of the game-settings lap):** the precached app works offline; the full offline screen appears only when a page fails to load while offline.
- **Separate feature (D5):** a different reason to change than settings; app-update owns only the service worker.
- **Kid-level copy (kids-content):** the offline texts say "Geen internet" instead of "offline"; texts still come from `UI_COPY.appStatus`.

## Testing

Vitest: `services/browserSupport.test.ts`, `components/AppStatusScreen.test.tsx` (load failed, unsupported, offline fallback). Playwright: offline banner and the boundary screens in the lap's play-test.

## Dependencies

- `@/features/game-content/api/copy` (`UI_COPY`), kit `Button`, `lucide-react`.
