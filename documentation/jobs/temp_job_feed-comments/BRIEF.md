# Brief — Follower comments under each feed post

Task: owner Stop 2 feedback on PR #45 via orchestrator ("de comments zouden IN de feed onder elk bericht moeten komen") · Lap: temp_job_feed-comments · Harness: v0.45.0

## Problem

The follower reactions sit in a separate 3-line LIVE strip under the feed, apart from the post they react to; the owner wants them as comments under each post, like on social media.

## Success check

After every card play and every event choice (after its dialog closes) 2–4 comments (face, name, one line) appear one by one under that post in the feed; older posts keep a collapsed comment plus "+N". The strip is gone and the feed has the full row. After a reload the same comments sit under the same posts. At 390×844 and 360×640: no document scroll, newest post visible, drop slot still opens, no console errors; one polite announcement per batch; reduced motion shows comments at once.

## In scope

- Rename feature `follower-chat` → `follower-comments` (F3/F4), comments component, reveal hook, per-step batches.
- game-session: `SessionStep.state` (engine state after the step) so older posts' comments are recomputed.
- game-board: `FeedEntry.step`, `PhoneFeed` renders comments, `PlayingBoard` drops the strip.
- game-content: `followers.ts`, `UI_COPY.comments`; three lines that said "chat" now say "reacties".

## Out of scope

- Will NOT touch: engine rules, save format, sounds, TTS, comment content beyond the three "chat" lines.

## Edges

| Feature area      | Loop today              | Hook point                                         | Ride / new |
| ----------------- | ----------------------- | -------------------------------------------------- | ---------- |
| follower-comments | follower-chat strip     | rename; `PostComments`, `useCommentReveal`         | ride       |
| game-session      | steps without state     | `SessionStep.state`                                | ride       |
| game-board        | feed row = feed + strip | `FeedEntry.step`, `PhoneFeed` comments + announcer | ride       |
| game-content      | `followerChat.ts`, copy | `followers.ts`, `UI_COPY.comments`                 | ride       |

## Size

S — one feature reshaped, three small hook points.
Cut into laps: none

## Plan (S)

1. Tests: services (per-step batches, crossing on a session), component (collapsed +N, reveal, wait for key, quiet at mount), board (comments under card and event posts, resume shows them silently).
2. Build session state, feature rename and comments, feed wiring; remove the strip.
3. Gates (type-check, lint, test:run, arch, structure, feature docs/size, bundle); Playwright on the preview at 390×844 and 360×640.

## Decisions

DECISIONS.md D1–D4.
