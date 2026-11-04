# BRIEF — game-settings

Task: "Settings, error states and launch audit" (`src/config/app-tasks.json`). Size **S** (orchestrator: S-M). Branch `feat/game-settings` (Model C). Orchestrated thread; owner decisions relayed by the orchestrator.

## Problem

Players cannot change sound, motion or colour mode outside the board, cannot read the rules, cannot wipe local data, and see an English "Something went wrong" when a chunk fails or they are offline. Launch needs an accessibility, keyboard and performance audit.

## Success check

- `/instellingen`: Geluid (Aan/Uit, the game-audio mute state), Beweging (Systeem / Verminderd / Volledig), Weergave (Licht / Donker / Systeem, `ColorModeContext`), Voortgang wissen with a confirm dialog that clears `clickbait-capital:*` keys and resets sound and motion live.
- Motion has one source of truth in `@/features/game-settings/api` (`useMotionPreference`, `useReducedMotion`); "Verminderd" also shortens the CSS duration tokens.
- `/hoe-speel-je`: short Dutch rules. Start screen links to Hoe speel je, Instellingen, Credits (`/credits`); the pause menu opens the same settings panel without leaving the game.
- App-level states: Offline banner, Laden mislukt (retry + home), Offline when a load fails offline, Browser niet ondersteund (home + browser tip). All copy in `uiCopy.ts`.
- Playwright at 390/820/1280: no console errors, no horizontal scroll, keyboard-only run; audit report with fixes and backlog proposals.

## In scope

`src/features/game-settings/` (new), `src/features/app-status/` (new, error/offline states), `src/pages/SettingsPage.tsx`, `src/pages/HowToPlayPage.tsx`, `src/App.tsx` routes + boundary fallback, `HomePage.tsx` links, `PauseMenu.tsx` settings entry, `uiCopy.ts` keys, `SegmentedControl` labelling prop.

## Out of scope

game-engine, game-juice, card-imagery, `/credits` page, `app-tasks.json`, motion token pipeline (juice thread), server-side data.

## Touched edges

game-audio api (mute), game-content api (copy), shared ColorModeContext, game-board PauseMenu, kit SegmentedControl.

## Plan (S, inline)

1. Copy keys; motion store (TDD) + hooks; progress reset service (TDD).
2. SettingsPanel + pages + routes + start links + pause entry.
3. app-status: online hook, browser support check, status screens, boundary fallback.
4. READMEs, gates, Playwright play-test + audit (contrast, keyboard, Lighthouse mobile, bundle).
