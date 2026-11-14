# Brief — App name and the official-account feed

Task: orchestrator, lap 1 of `documentation/jobs/temp_job_policy-cards/PROPOSAL.md` § 10 · Lap: temp_job_app-name · Branch: feat/app-name · Size: M

## Problem

The player is a company, but the app has no name, and the feed does not read as the company's own account. The owner decided (PROPOSAL § 0, D2) that the player names the app at the start. The name shows on the feed as an official account and in the texts about the run. Decision cards (lap 2) post as official announcements by that app.

## Success check

- Starting a new game (from `/` or `/spel` with no save) shows "Hoe heet jouw app?" before the phase 1 intro. A suggested name is filled in, 🎲 gives another one, and Start continues. Empty input, too short or too long (2–16 characters), disallowed characters, a real platform or brand name, or a swear word (including letter swaps such as `k4nker`) show an inline Dutch error and block Start.
- The name is saved with the run (`SavedRun.appName`, optional, no version bump). A resumed run keeps its name, and an older save resumes as "Jouw app". "Opnieuw" on the end screen keeps the name.
- The name shows in: the feed header ("{app} · Officieel ✓"), the feed's accessible name, the phase intros, event texts, the game-over story and end report, the share text and share card, the resume screen and some follower comments.
- A card with an `announce` presentation field (lap 2 adds the content) renders in the feed as an official post: app name, ✓, "Officieel", announce title and body. Tested with a fixture card.
- Unit tests for the name rules and the `{app}` filling; the existing suites stay green. Checked on the preview on a phone and on desktop: `/` → name → intro → play.

## In scope

- New feature `app-name`: name rules (normalising, validation, profanity list, brand list), suggestions.
- game-flow: `AppNameScreen`; `{app}` in the phase intro and endings.
- game-session / game-save: `appName` on the session and the save.
- game-board: `appName` in the board view, feed header, official-post variant, `{app}` in card, event and feed texts.
- follower-comments: `{app}` in follower lines.
- game-content: copy (`UI_COPY.appName`, `{app}` in intros, endings, report, share text, resume, two follower lines), suggestions list, brand list moved from the test to a service.
- `src/pages/GamePage.tsx`: naming step for a new run.

## Out of scope

- The `announce` and `realCase` content fields and `CardDetailDialog` (lap 2). The board reads `announce` duck-typed, like `flavor`, so no type change collides with lap 2.
- New cards and events, balance, imagery.

## Decisions

- **AN1 Name lives with the run.** `SessionState.appName`, written to `SavedRun.appName`. The engine stays unaware of it (presentation only). Replay does not depend on the name, so no save-version bump.
- **AN2 Own feature.** `app-name` owns validation, the profanity list, the suggestions and the naming screen (one concept: the player's app name). The screen is built on game-flow's `FlowScreen`, which game-flow now exports. Putting the screen in game-flow would have pushed its components over the feature-size budget.
- **AN3 No package.** A small Dutch + English blocklist with letter-swap normalising (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s), spaces and punctuation removed, checked as substrings. A package would be a new dependency, and the common ones have no Dutch.
- **AN4 Real platform names blocked.** The tone rule (no real brands) also covers the player's input. The brand list moves out of `gameContent.test.ts` into game-content, so the test and the name rules share one list.
