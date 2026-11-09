# Follower chat

A livestream-style chat under the phone feed: a small cast of recurring followers reacts to every post and event choice with one short line each. It is juice and explanation in one: players who skip the card text still see what their choice did (hype for viral, groans for ads, praise from the critics for news; a faster, meaner chat as Toxicity rises; critics complaining and leaving as reputation drops).

## Purpose

- Turns the last action into 2–4 chat lines (`chatForStep` / `chatForSession`), pure and seeded on run seed + step.
- Shows them in a fixed-height strip (`FollowerChat`) that reveals line by line, never takes a tap and never moves the board.
- No game rules, no run state, nothing in the save: the chat is derived from the game-session state, so a replay gives the same lines.

## Structure

| Layer      | Path                          | Purpose                                                                                                    |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                | `FollowerChat`, `chatForSession`, `chatForStep`, chat types                                                |
| Components | `components/FollowerChat.tsx` | The chat strip: face, name, line; LIVE badge; one polite announcement per batch                            |
| Hooks      | `hooks/useChatFeed.ts`        | Reveals a batch line by line once the board's juice key reaches it; keeps the last 6 lines; reduced motion |
| Services   | `services/chatReactions.ts`   | Pure: state after an action → cues, pace and the seeded pick of followers and lines                        |
| Types      | `types/followerChat.types.ts` | `ChatMessage`, `ChatBatch`, `ChatPace`                                                                     |

Content (personas and lines) lives in game-content: `FOLLOWERS` in `src/features/game-content/services/followerChat.ts`, copy in `UI_COPY.chat`.

## Decisions

- **Own feature (follower-chat D1):** the audience's reaction is one bounded concept with its own vocabulary (followers, cues, pace), separate from the board's layout and the juice's motion primitives. The board only hosts the strip: `useBoardSession` adds `chat`, `PlayingBoard` puts `FollowerChat` under `PhoneFeed` in the feed row (fixed 3-line height, so the feed absorbs the space; no overlay on feed or draft).
- **Cues (D2):** the topic is the card type, or for an event the card type its option plays like (engagement → viral, commercial → ad, journalism → news, as event-juice-drop D1). State cues: `toxic` (Toxicity ≥ 65), `adFatigue` / `echoChamber` / `drought` (the engine's turn modifiers), `complain` (reputation < 45), `hype` (users +14 or more this turn: the bigger viral hits). Each line comes from a different follower; a follower without lines for a cue stays quiet.
- **Pace (D3):** Toxicity < 35 calm (2 lines, 550 ms apart), < 65 busy (3, 350 ms), else wild (4, 200 ms, the mean `toxic` lines first, red border). Reputation < 25: one critical follower (Oma Riet, Nina_Checkt) leaves ("… ontvolgt je 👋") and the critics stop talking, so the chat that is left is the echo chamber.
- **Deterministic, not saved (D4):** selection uses the engine's `nextRandom` on `seed ^ step`, separate from the run RNG, so it never changes the game. The chat is a function of the session, so `SAVED_RUN_VERSION` is unchanged. Steps replayed from a save produce no chat (like the board sounds), and a batch present at mount (return from a phase intro) does not replay.
- **Timing and screen readers (D5):** the strip reveals a batch when the board's juice key reaches it, so after an event the chat waits for the dialog to close, like the meters (event-juice-drop D3). The list is not a live region; one polite text ("Chat: name: line", the first line) goes out after the last line and at least 600 ms after the action, after the board's turn summary. Reduced motion: all lines at once, no slide.

## Testing

`services/chatReactions.test.ts` (determinism, lines per pace, wild lines first, critics leave, event option topic, modifier cues, quiet on replay, every follower has lines for all topics), `components/FollowerChat.test.tsx` (waiting line, stagger, waiting for the reveal key, quiet at mount, one announcement after the lines), board integration in `src/features/game-board/components/GameBoard.test.tsx` § follower chat.

## Dependencies

- `@/features/game-engine/api` (`nextRandom`, state and content types).
- `@/features/game-content/api` (`FOLLOWERS`, `UI_COPY.chat`, `fillTemplate`, persona types).
- `@/features/game-session/api` (`SessionState` type).
- `@/features/game-settings/api` (`useReducedMotion`).
- Animation: the game-juice `animate-juice-slide` keyframes (`src/index.css`), motion tokens.
