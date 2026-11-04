# BRIEF — game-audio

Task: "Audio with mute toggle" (`src/config/app-tasks.json`). Size **M**. Branch `feat/game-audio` (Model C).

## Problem

The game has no sound. DOC_GAME_DESIGN § 5 makes audio part of the satire: viral plays are loud and euphoric, ads satisfying, news dull. Players on phones also need a reliable way to switch sound off.

## Success check

- 11 sound effects in `public/audio/` (< 1.5 MB total), generated with ElevenLabs in one shared style, listed in a manifest with prompt, generator, date and license, plus a credit line.
- `useSoundEffects().play(id)` plays a sound only after the first user gesture and never while muted.
- `MuteToggle` (≥ 44 px, `aria-pressed`, icon + Dutch label) switches sound for the whole page and is remembered across reloads; blocked storage does not break it.
- Tests for player, storage and toggle pass; type-check, lint, arch, structure green.

## In scope

`src/features/game-audio/` (new feature + README), `public/audio/*.mp3`, the `public/audio` whitelist entry (protected config, orchestrator consent).

## Out of scope

Wiring into the board (follow-up commit once `game-board` merged), settings screen (game-settings lap), background music, service-worker caching (installable-app lap).

## Touched edges

`@/features/game-audio/api` consumed later by `game-board`; `projectStructure.config.cjs` (public/audio).

## Plan (S-style, inline)

1. Generate sounds with the shared style guide; trim, peak-normalize, encode mono 96 kbps MP3.
2. Types + manifest + mute storage + Web Audio player (TDD on the player).
3. Hook with one-time unlock listeners and `useSyncExternalStore` for mute.
4. `MuteToggle` on the kit `Button`; api barrel; README with § Sound style and decisions.
5. After the board merges: `play` per card/event/game over and `MuteToggle` on the board.
