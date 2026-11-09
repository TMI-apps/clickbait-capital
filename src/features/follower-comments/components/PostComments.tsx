import { fillTemplate, UI_COPY } from "@/features/game-content/api";
import type { FollowerTone } from "@/features/game-content/api";
import type {
  CommentBatch,
  FollowerComment,
} from "@/features/follower-comments/types/followerComments.types";
import { cn } from "@/shared/utils/cn";

/** Avatar tint per follower tone (theme tokens; the face emoji carries the character). */
const TONE_CLASS: Record<FollowerTone, string> = {
  primary: "bg-primary/20",
  viral: "bg-type-viral/25",
  ad: "bg-type-ad/25",
  news: "bg-type-news/25",
  success: "bg-success/25",
  warning: "bg-warning/25",
};

interface CommentLineProps {
  comment: FollowerComment;
  animate: boolean;
  /** Older posts keep each comment to one line; the newest may wrap to two. */
  oneLine: boolean;
}

const CommentLine = ({ comment, animate, oneLine }: CommentLineProps) => (
  <li
    data-kind={comment.kind}
    className={cn(
      "flex min-w-0 items-start gap-1.5 text-xs leading-4",
      animate && "animate-juice-slide",
      comment.kind === "leave" && "text-muted-foreground italic"
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full text-[0.625rem]",
        TONE_CLASS[comment.tone]
      )}
    >
      {comment.face}
    </span>
    <span className={cn("min-w-0", oneLine ? "truncate" : "line-clamp-2")}>
      {comment.kind === "line" && <span className="font-bold">{comment.name} </span>}
      {comment.text}
    </span>
  </li>
);

export interface PostCommentsProps {
  batch: CommentBatch;
  /**
   * `full`: the newest post, its first `shown` comments (they reveal one by one).
   * `collapsed`: an older post, its first comment plus "+N" (feed-comments D2).
   */
  variant: "full" | "collapsed";
  /** Full variant: how many comments are revealed so far. */
  shown?: number;
  /** Reduced motion: no entrance slide. */
  reduced?: boolean;
  className?: string;
}

/**
 * The followers' comments under one feed post (feed-comments D1): face, name and one short
 * line each, like comments under a social media post. A nested list inside the post, so the
 * feed list stays readable for screen readers; announcing new comments is `CommentAnnouncer`'s
 * job. A wild (toxic) batch gets a red edge (follower-chat D3).
 */
export const PostComments = ({
  batch,
  variant,
  shown = batch.comments.length,
  reduced = false,
  className,
}: PostCommentsProps) => {
  const collapsed = variant === "collapsed";
  const visible = batch.comments.slice(0, collapsed ? 1 : shown);
  const hidden = collapsed ? batch.comments.length - visible.length : 0;
  if (visible.length === 0) return null;
  return (
    <div
      data-comments={variant}
      data-pace={batch.pace}
      className={cn(
        "min-w-0 border-l-2 border-border pl-2",
        batch.pace === "wild" && "border-destructive/70",
        className
      )}
    >
      <ol aria-label={UI_COPY.comments.label} className="flex flex-col gap-0.5">
        {visible.map((comment) => (
          <CommentLine
            key={comment.key}
            comment={comment}
            animate={!collapsed && !reduced}
            oneLine={collapsed}
          />
        ))}
      </ol>
      {hidden > 0 && (
        <p className="pl-5.5 text-[0.625rem] leading-3.5 font-semibold text-muted-foreground">
          {hidden === 1
            ? UI_COPY.comments.moreOne
            : fillTemplate(UI_COPY.comments.more, { count: String(hidden) })}
        </p>
      )}
    </div>
  );
};

export interface CommentAnnouncerProps {
  /** From `useCommentReveal`: one polite text per batch. */
  announcement: { key: number; text: string } | null;
}

/** The comments' own polite live region: one text per batch, after the board's turn summary (follower-chat D5). */
export const CommentAnnouncer = ({ announcement }: CommentAnnouncerProps) => (
  <p aria-live="polite" data-comment-announcer className="sr-only">
    {announcement && <span key={announcement.key}>{announcement.text}</span>}
  </p>
);
