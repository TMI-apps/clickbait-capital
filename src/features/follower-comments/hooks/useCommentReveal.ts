import { useEffect, useState } from "react";
import { fillTemplate, UI_COPY } from "@/features/game-content/api";
import { useReducedMotion } from "@/features/game-settings/api";
import type {
  CommentBatch,
  CommentPace,
  FollowerComment,
} from "@/features/follower-comments/types/followerComments.types";

/** Time between two comments of one batch: a toxic crowd comments faster (follower-chat D3). */
export const COMMENT_STAGGER_MS: Record<CommentPace, number> = {
  calm: 550,
  busy: 350,
  wild: 200,
};

/**
 * The batch's one announcement goes out after its last comment and at least this long after the
 * action, so it follows the board's turn summary (sent 150 ms after focus moves).
 */
export const COMMENT_ANNOUNCE_AFTER_MS = 600;

export interface CommentReveal {
  /** How many comments of the newest post's batch to show now. */
  shown: number;
  /** One polite screen-reader text per batch (the first comment), keyed per batch; null when quiet. */
  announcement: { key: number; text: string } | null;
  /** Under reduced motion comments appear together without entrance motion. */
  reduced: boolean;
}

/**
 * Reveals the newest post's comments one by one once `revealKey` reaches the batch key — the
 * board passes its juice key, so after an event the comments wait for the dialog to close like
 * the meter juice (event-juice-drop D3, feed-comments D4). A batch already there at mount (a
 * resume or a phase intro return) shows at once, without motion or announcement. Lives above the
 * posts, because the newest post mounts with its batch already in place.
 */
export function useCommentReveal(batch: CommentBatch | null, revealKey: number): CommentReveal {
  const reduced = useReducedMotion();
  const [mountKey] = useState(revealKey);
  const [revealed, setRevealed] = useState({ key: -1, count: 0 });
  const [announcedKey, setAnnouncedKey] = useState<number | null>(null);
  const live = liveBatch(batch, revealKey, mountKey);

  useEffect(() => {
    if (!live) return undefined;
    const gap = reduced ? 0 : COMMENT_STAGGER_MS[live.pace];
    const timers = live.comments.map((_, index) =>
      window.setTimeout(() => setRevealed({ key: live.key, count: index + 1 }), index * gap)
    );
    const lastAt = Math.max(0, live.comments.length - 1) * gap;
    timers.push(
      window.setTimeout(
        () => setAnnouncedKey(live.key),
        Math.max(lastAt, COMMENT_ANNOUNCE_AFTER_MS)
      )
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [live, reduced]);

  return {
    shown: shownCount({ batch, revealKey, live, revealed }),
    announcement: announcementFor(live, announcedKey),
    reduced,
  };
}

/** The batch to play now: it reached the reveal key and was not already there at mount. */
function liveBatch(
  batch: CommentBatch | null,
  revealKey: number,
  mountKey: number
): CommentBatch | null {
  return batch !== null && batch.key === revealKey && revealKey !== mountKey ? batch : null;
}

interface ShownInput {
  batch: CommentBatch | null;
  revealKey: number;
  live: CommentBatch | null;
  revealed: { key: number; count: number };
}

function shownCount({ batch, revealKey, live, revealed }: ShownInput): number {
  if (!batch || batch.key > revealKey) return 0;
  if (!live) return batch.comments.length;
  return revealed.key === live.key ? revealed.count : 0;
}

function announcementFor(
  live: CommentBatch | null,
  announcedKey: number | null
): CommentReveal["announcement"] {
  const first = live?.comments[0];
  if (!live || !first || announcedKey !== live.key) return null;
  return { key: live.key, text: announcementText(first) };
}

function announcementText(comment: FollowerComment): string {
  return comment.kind === "leave"
    ? comment.text
    : fillTemplate(UI_COPY.comments.announcement, { name: comment.name, text: comment.text });
}
