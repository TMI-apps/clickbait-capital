# Brief — Local save and resume

Task: Proposed: Local save and resume · Lap: temp_job_local-save · Branch: feat/local-save · Harness: v0.45.0

## Problem

A run lives only in React state on `/spel`, so a refresh, an app update ("Nu laden") or the phone killing the installed app loses it.

## Success check

- Play a few turns at 390px, reload: `/spel` offers "Verder spelen" / "Nieuw spel"; "Verder spelen" shows the identical meters, hand, turn, phase and feed.
- After a run ends (won or lost), neither `/` nor `/spel` offers "Verder spelen".
- Corrupt JSON, a wrong shape, an unknown version or an action the engine rejects are discarded without a crash, and the player gets a fresh game.

## In scope

- New feature `game-save`: one versioned `localStorage` key `clickbait-capital:run:v1` holding `{ version: 1, seed, actions }` (D1); read with shape validation, write, clear; `useRunStart` picks ask / resume / new from the save and the router state.
- game-board: the session's action handling moves into a pure service (`applyAction`, `restoreSession` = replay); the session keeps its action log, persists after every action and clears on the end or an empty run; a resumed board skips the phase intro and announces "Spel hervat. Fase N van 4, <naam>. Beurt T." (D5).
- game-flow: `ResumeScreen` (FlowScreen with "Verder spelen" / "Nieuw spel"); `usePhaseIntro` takes the already-seen phase.
- Pages: Home shows "Verder spelen" + "Nieuw spel" when a save exists (else "Start spel"); `/spel` asks via `ResumeScreen` unless Home already chose.
- Privacy copy: the saved game is named; clear hint names Instellingen → Voortgang wissen (which already clears every `clickbait-capital:` key).
- app-update: keep D1 policy and banner; update the rationale text (D6).

## Out of scope

- Will NOT do: several save slots, cloud/account sync, a save-failed message (storage errors are swallowed, D7), migration of old versions (unknown versions are discarded).
- Will NOT touch: the results/share screen (parallel thread), engine rules, `src/config/app-tasks*.json`, the update banner copy.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| game-save | Not found | storage + start choice | new — bounded concept "saved run on this device" |
| game-board | `useGameSession` holds the run in memory | session service, persist effect, resume announcement | ride |
| game-flow | phase intro / end screens | `ResumeScreen`, `usePhaseIntro(initialSeenPhase)` | ride |
| pages Home / Game / Privacy | start button; board; privacy note | resume offer; choice; copy | ride |
| game-content `UI_COPY` | `start.continueButton`/`newGameButton` exist unused | resume screen + announcement copy, privacy lines | ride |
| app-update | D1 safe moments | README / hook comment only | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one new small feature, a pure extraction in game-board, one screen, copy.
Cut into laps: none

## Plan (S)

1. Acceptance tests first: `savedRunStorage.test.ts` (round-trip, corrupt JSON, wrong shape, old version, blocked storage), `gameSession.test.ts` (replay reproduces the state; rejected action → null; ended replay → null), `useGameSession.test.ts` (persists after an action, cleared on end and on restart), `HomePage.test.tsx` (offer with a save, none without), `PrivacyPage.test.tsx` (saved-game line).
2. game-save feature (types, services, `useRunStart`, api, README).
3. game-board session service + hook persistence + resume announcement; game-flow `ResumeScreen` + `usePhaseIntro` param; pages.
4. Copy (start/resume/privacy), app-update README + hook comment, decision log section.
5. Gates: lint, type-check, test, arch, structure, feature-size/docs, bundle budget; Playwright at 390px on the preview.

## Decisions

DECISIONS.md D1–D9.
