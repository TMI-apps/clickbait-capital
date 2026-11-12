# Game settings

Player settings for Clickbait Capital: sound, motion, colour mode and wiping local data. Screens: `/instellingen` (`src/pages/SettingsPage.tsx`) and the board's pause menu, both rendering `SettingsPanel`.

## Purpose

- **Geluid (Aan / Uit):** the game-audio mute state via `useSoundEffects` — no copy of it here.
- **Beweging (Systeem / Verminderd / Volledig):** the one source of truth for motion. Animations call `useReducedMotion()` from `@/features/game-settings/api`; it is true for "Verminderd", false for "Volledig", and follows `prefers-reduced-motion` for "Systeem" (live). Stored as `clickbait-capital:motion`.
- **Trillen (Aan / Uit):** vibration on key moments (game-juice gates every vibration step on it); default Aan, stored as `clickbait-capital:haptics`. Shown only where the browser can vibrate (`navigator.vibrate`; iOS browsers can't), so no switch does nothing.
- **Weergave (Licht / Donker / Systeem):** `ColorModeContext` (`src/shared/context/ColorModeContext.tsx`).
- **Voortgang wissen:** confirm dialog; resets sound, motion and vibration live, then removes every `localStorage` key starting with `GAME_STORAGE_PREFIX` (`clickbait-capital:`). Nothing lives server-side. New game keys must use that prefix.
- All copy: `UI_COPY.settings` in `@/features/game-content/api`.

## Structure

| Layer      | Path                                                    | Purpose                                                                                                                          |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                                          | `SettingsPanel`, `useMotionPreference`, `useReducedMotion`, `getMotionStore`, `GAME_STORAGE_PREFIX`, `MOTION_PREFERENCES`, types |
| Components | `components/SettingsPanel.tsx`                          | The three segmented settings plus the wipe section                                                                               |
| Components | `components/SettingRow.tsx`, `ResetProgressSection.tsx` | Labelled 44 px `SegmentedControl` row; wipe button + confirm `Modal` + status line                                               |
| Hooks      | `hooks/useMotionPreference.ts`                          | `useMotionPreference` (choice + setter + resolved), `useReducedMotion` (resolved only)                                           |
| Hooks      | `hooks/useResetProgress.ts`                             | Live reset of sound and motion, then `clearGameStorage`                                                                          |
| Services   | `services/motionPreference.ts`                          | `createMotionStore` (external store, OS watch), `getMotionStore` page singleton, `applyMotionToDocument`                         |
| Services   | `services/gameStorage.ts`                               | `GAME_STORAGE_PREFIX`, `clearGameStorage`                                                                                        |
| Types      | `types/motionPreference.types.ts`                       | `MOTION_PREFERENCES`, `MotionPreference`, `MotionStore`                                                                          |

## Decisions

- **Settings inside the pause menu (D1):** the pause dialog swaps to `SettingsPanel`; navigating to `/instellingen` would end the in-memory run.
- **External store, no provider (D2):** `useSyncExternalStore` over a module singleton, like the game-audio mute, so any feature reads it without a provider in `App.tsx`.
- **CSS follows the choice (D3):** the store sets `data-motion="reduced|full"` on `<html>`; for "Verminderd" it also sets the `--duration-*` tokens to `0.01ms` inline. "Volledig" lifts JS juice, and game-juice restores its own durations under `data-motion="full"` (`src/index.css`); the rest of the token CSS still honours an OS reduce request (amended by juice-motion-setting D1).
- **Trillen store (juice-wiring-flow D3):** `getHapticsStore` mirrors the motion store (external store, `useHapticsPreference`); a second copy of a stored on/off page setting next to game-audio's mute, marked for extraction at a third. `onGameStorageCleared` lets features drop in-memory state after "Voortgang wissen" (game-juice reloads its tuning) without game-settings importing them.
- **Colour mode survives a wipe (D4):** `color-mode` is a display preference shared with the harness, not game data.

## Testing

Vitest, colocated: `services/motionPreference.test.ts` (resolve, store, OS change, reset, document), `services/gameStorage.test.ts`, `components/SettingsPanel.test.tsx` (each setting, wipe confirm and cancel). Playwright play-test at 390 / 820 / 1280 px in the lap's PR.

## Dependencies

- `@/features/game-audio/api` (`useSoundEffects`), `@/features/game-content/api` (`UI_COPY`).
- `@/shared/context/ColorModeContext`, `@/shared/theme/colorMode` (type), `@/shared/theme/themeTokens` (duration token names).
- Kit: `SegmentedControl` (`size="lg"`, `labelledBy`), `Button`, `Modal`.
