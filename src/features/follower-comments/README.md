# Follower comments

The followers' comments under each feed post: a small cast of recurring followers reacts to every post and event choice with one short comment each, like comments under a social media post. It is juice and explanation in one: players who skip the card text still see what their choice did (hype for viral, groans for ads, praise from the critics for news; more and meaner comments as Toxicity rises; critics complaining and leaving as reputation drops).

## Purpose

- Turns each action into 2–4 comments (`commentsForStep`), pure and seeded on run seed + step; `commentsForSession` gives the batch for every step of a run, so older posts keep theirs.
- `PostComments` draws a batch under a post (face, name, one line; the newest post in full, older posts collapsed to the first comment plus "+N reacties"); `useCommentReveal` reveals the newest post's batch one by one; `CommentAnnouncer` is the one polite announcement per batch.
- No game rules and nothing in the save: the comments are derived from the game-session steps, so a replay or resume gives the same comments.

## Structure

| Layer      | Path                              | Purpose                                                                                                                     |
| ---------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                    | `PostComments`, `CommentAnnouncer`, `useCommentReveal`, `commentsForSession`, `commentsForStep`, comment types              |
| Components | `components/PostComments.tsx`     | The comment list under one post (full or collapsed), wild edge; `CommentAnnouncer` (polite live region)                     |
| Hooks      | `hooks/useCommentReveal.ts`       | Reveals the newest batch comment by comment once the board's juice key reaches it; quiet at mount; reduced motion; announce |
| Services   | `services/followerComments.ts`    | Pure: state after an action → cues, pace and the seeded pick of followers and lines; per step for a whole session           |
| Types      | `types/followerComments.types.ts` | `FollowerComment`, `CommentBatch`, `CommentPace`                                                                            |

Content (personas and lines) lives in game-content: `FOLLOWERS` in `src/features/game-content/services/followers.ts`, copy in `UI_COPY.comments`.

## Decisions

- **The player's app in the comments (app-name lap):** a follower line may contain `{app}`. `commentsForStep` fills it from the session's `appName` ("Jouw app" without one).
- **Own feature, comments in the feed (follower-chat D1, superseded by feed-comments D1):** the audience's reaction is one bounded concept with its own vocabulary (followers, cues, pace), separate from the board's layout and the juice's motion primitives. It was a fixed 3-line LIVE strip under the feed (follower-chat); the owner asked for the reactions inside the feed, under the post they react to, so the feature was renamed from `follower-chat` to `follower-comments` and the board only hosts it: `PhoneFeed` puts `PostComments` in each post and the feed has its full height again.
- **Collapse (feed-comments D2):** the newest post shows all its comments (2–4, at most two lines each); older posts show only the first comment on one line plus "+N reacties", so the feed stays readable and a toxic first comment still shows. Screen readers get the same comments as the screen.
- **Cues (follower-chat D2):** the topic is the card type, or for an event the card type its option plays like (engagement → viral, commercial → ad, journalism → news, as event-juice-drop D1). State cues: `toxic` (Toxicity ≥ 65), `adFatigue` / `echoChamber` (the engine's turn modifiers; the `drought` cue and its lines went with Journalistieke Droogte, balance-cleanup D1), `complain` (reputation < 45; the engine's hidden `GameState.reputation`, no longer a board meter since score-redesign D13), `hype` (users +14 or more this turn: the bigger viral hits). Each comment comes from a different follower; a follower without lines for a cue stays quiet.
- **Official posts (policy-cards § 8, decision-cards lap):** under a decision card (game-content `announce`) the post's own cue is the official cue of its direction (`officialViral`, `officialAd`, `officialNews`) instead of the type cue; `CommentContext.postCue` carries it. The state cues still run on top, so comments under official posts sour as reputation drops. The card is looked up with `getContentCard`, so the engine stays unaware of decisions.
- **Pace (follower-chat D3):** Toxicity < 35 calm (2 comments, 550 ms apart), < 65 busy (3, 350 ms), else wild (4, 200 ms, the mean `toxic` comments first, red edge on the comment list). When an action drops reputation below 25, the critical followers (Oma Riet, Nina_Checkt) leave ("… ontvolgt je 👋", once, from the previous step's state) and stay quiet while it stays below, so the comments that are left are the echo chamber; they talk again once reputation recovers.
- **Deterministic, recomputed, not saved (feed-comments D3, supersedes follower-chat D4):** selection uses the shared seeded `nextRandom` (`@/shared/utils/seededRandom`) on `seed ^ step`, separate from the run RNG, so it never changes the game. Each game-session step keeps the engine state right after it (`SessionStep.state`), so `commentsForSession` recomputes every post's comments; a resume replays the actions and gets the same comments. The save format is unchanged (`SAVED_RUN_VERSION` stays 3). A resumed run shows the comments of every post at once, without motion or announcement.
- **Timing and screen readers (feed-comments D4, follower-chat D5):** the newest post's comments reveal when the board's juice key reaches their batch, so after an event they wait for the dialog to close, like the meters (event-juice-drop D3). Each comment list is a nested list inside its post (`aria-label` "Reacties van je volgers"), not a live region; one polite text ("Reactie: name: line", the first comment) goes out after the last comment and at least 600 ms after the action, after the board's turn summary. Reduced motion: all comments at once, no slide.
- **Latest comment ref (juice-wiring-board D7):** `PostComments` takes an optional `latestRef` for the newest shown comment, so the board can make it a juice anchor (`comment:latest`) without querying the DOM; the comments stay presentational and know nothing about juice.

## Testing

`services/followerComments.test.ts` (determinism, comments per pace, wild first, critics leave once on the crossing and stay quiet, per-step batches for a session incl. the crossing step, event option topic, modifier cues, every follower has lines for all topics and all official cues, official cue under a decision card), `components/PostComments.test.tsx` (collapsed +N, nothing before the reveal, stagger and one announcement, waiting for the reveal key, at once and silent at mount), board integration in `src/features/game-board/components/GameBoard.test.tsx` § feed comments and § resumed from a save.

## Dependencies

- `@/features/game-engine/api` (state and content types); `@/shared/utils/seededRandom` (`nextRandom`).
- `@/features/game-content/api` (`FOLLOWERS`, `UI_COPY.comments`, `fillTemplate`, persona types).
- `@/features/game-session/api` (`SessionState` type).
- `@/features/game-settings/api` (`useReducedMotion`).
- Animation: the game-juice `animate-juice-slide` keyframes (`src/index.css`), motion tokens.
