/*
 * Types files may not import a feature barrel (it carries runtime code), so this mirrors
 * game-content's `FollowerTone`; `services/chatReactions.ts` assigns persona tones to it, so a
 * drift fails type-check there (same pattern as game-board's types).
 */
type FollowerTone = "viral" | "ad" | "news" | "primary" | "success" | "warning";

/** One line in the live chat: a follower's reaction, or a follower leaving. */
export interface ChatMessage {
  /** Unique within the run: `<step>-<index>`. */
  key: string;
  kind: "line" | "leave";
  followerId: string;
  name: string;
  face: string;
  tone: FollowerTone;
  /** The line itself; for `leave` the filled "ontvolgt je" copy. */
  text: string;
}

/** How busy the chat is: Toxicity makes it faster, louder and meaner (follower-chat D3). */
export type ChatPace = "calm" | "busy" | "wild";

/** The chat's reaction to one player action. */
export interface ChatBatch {
  /** Changes once per action: the session's step count. */
  key: number;
  pace: ChatPace;
  messages: ChatMessage[];
}
