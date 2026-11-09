/*
 * Types files may not import a feature barrel (it carries runtime code), so this mirrors
 * game-content's `FollowerTone`; `services/followerComments.ts` assigns persona tones to it, so a
 * drift fails type-check there (same pattern as game-board's types).
 */
type FollowerTone = "viral" | "ad" | "news" | "primary" | "success" | "warning";

/** One comment under a feed post: a follower's reaction, or a follower leaving. */
export interface FollowerComment {
  /** Unique within the run: `<step>-<index>`. */
  key: string;
  kind: "line" | "leave";
  followerId: string;
  name: string;
  face: string;
  tone: FollowerTone;
  /** The comment itself; for `leave` the filled "ontvolgt je" copy. */
  text: string;
}

/** How busy the comments are: Toxicity makes them more, faster and meaner (follower-chat D3). */
export type CommentPace = "calm" | "busy" | "wild";

/** The followers' comments under one post (one player action). */
export interface CommentBatch {
  /** The post's step + 1: matches the board's juice key once that action's juice plays. */
  key: number;
  pace: CommentPace;
  comments: FollowerComment[];
}
