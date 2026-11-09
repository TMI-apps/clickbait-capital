# Brief — Followers with faces and a live chat

Task: player feedback via orchestrator (players skip card text; want juice) · Lap: temp_job_follower-chat · Harness: v0.45.0

## Problem

Players click through fast and don't read the cards, so the consequence of a choice (hype, ad annoyance, trust, toxicity) is missed.

## Success check

After every card play and every event choice (after its dialog closes) 2–4 short Dutch lines from recurring followers appear in a chat strip under the feed, matching the post's topic and the run state (faster/meaner with Toxicity, critics complaining/leaving with low reputation). At 390×844 and 360×640: no document scroll, chat does not overlap feed or draft, no console errors; one polite announcement per batch; reduced motion shows lines without motion. Same run + step → same lines (no save change).

## In scope

- Personas and lines as data in game-content (`FOLLOWERS`, `UI_COPY.chat`).
- New feature `follower-chat`: pure seeded selection, chat strip component, reveal hook.
- Board: `useBoardSession` adds `chat`; `PlayingBoard` stacks the strip under the feed.

## Out of scope

- Will NOT touch: hand rendering (parallel thread feat/shuffled-hand), engine rules, save format, sounds, TTS.

## Edges

| Feature area  | Loop today             | Hook point                                 | Ride / new |
| ------------- | ---------------------- | ------------------------------------------ | ---------- |
| follower-chat | —                      | new feature                                | new        |
| game-content  | cards, UI copy         | `FOLLOWERS`, `UI_COPY.chat`, persona types | ride       |
| game-board    | feed row = `PhoneFeed` | `useBoardSession.chat`, feed row wrapper   | ride       |
| game-engine   | `nextRandom` internal  | export `nextRandom` from the api barrel    | ride       |

## Size

S — one new feature, three small hook points.
Cut into laps: none

## Plan (S)

1. Tests: `chatReactions` (determinism, pace, critics, event topic), `FollowerChat` (stagger, hold via reveal key, quiet at mount, one announcement), board integration.
2. Build content, feature, board wiring.
3. Gates (type-check, lint, test:run, arch, structure, feature docs/size, bundle); Playwright on the preview at 390×844 and 360×640.

## Decisions

DECISIONS.md D1–D5.
