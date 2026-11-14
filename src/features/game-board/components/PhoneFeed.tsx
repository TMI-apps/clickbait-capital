import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { BadgeCheck, Megaphone, Newspaper, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GameCardArtwork } from "@/components/common/GameCard";
import type { GameCardImage } from "@/components/common/GameCard";
import { getCardImage } from "@/features/card-imagery/api";
import type { FeedEntry } from "@/features/game-board/types/gameBoard.types";
import { CommentAnnouncer, PostComments, useCommentReveal } from "@/features/follower-comments/api";
import type { CommentBatch, CommentReveal } from "@/features/follower-comments/api";
import { fillTemplate, UI_COPY } from "@/features/game-content/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import { useCommentArrivals } from "@/features/game-board/hooks/useBoardJuice";
import { cn } from "@/shared/utils/cn";

/** Drop target id the draft cards are dragged onto. */
export const FEED_DROP_ID = "feed";

/**
 * Photo height of the newest post and its drop slot (feed-top-card D1–D3): a banner cropped
 * with object-fit: cover around the focal point. At most 12rem and never taller than 4:3 (D3);
 * on a short feed box it shrinks so type, title and body (~7rem) still fit under it (D2); never
 * under 4rem.
 * `cq*` units resolve against the feed list, which is a size container.
 */
const NEWEST_PHOTO_HEIGHT =
  "aspect-auto h-[max(4rem,min(12rem,calc(100cqh-7rem),calc(100cqw/var(--game-card-image-aspect))))]";

/** Type label per post. Posts carry no type-coloured side bar: the card stands on its own (readable-hover D5). */
const POST_STYLE: Record<FeedEntry["type"], { label: string; icon: LucideIcon }> = {
  viral: { label: "Viraal", icon: Zap },
  ad: { label: "Advertentie", icon: Megaphone },
  news: { label: "Nieuws", icon: Newspaper },
  event: { label: "Gebeurtenis", icon: Siren },
};

interface PostArtworkProps {
  entry: FeedEntry;
  compact: boolean;
  /** Layout override for the image area (the newest post's photo height). */
  className?: string;
}

/**
 * The entry's picture in the kit's card artwork (same image path as the draft: lazy, focal
 * point, ThumbnailFrame except on news, type-icon placeholder; feed-images D1). A compact row
 * drops caption, sticker and marker, which are unreadable at 64 px (D4).
 */
const PostArtwork = ({ entry, compact, className }: PostArtworkProps) => {
  const image = getCardImage(entry.contentId);
  const shown: GameCardImage | undefined =
    image && compact ? { ...image, thumbnail: undefined } : (image ?? undefined);
  return <GameCardArtwork type={entry.type} image={shown} className={className} />;
};

const TypeLabel = ({ type }: { type: FeedEntry["type"] }) => {
  const style = POST_STYLE[type];
  return (
    <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <style.icon aria-hidden="true" className="size-3.5 shrink-0" />
      {style.label}
    </p>
  );
};

/**
 * The player's app as the author of its own posts (app-name lap): initial-letter avatar, name,
 * check mark and "Officieel". Heads the feed (it is the app's official account) and every
 * decision card's announcement.
 */
const OfficialAuthor = ({ appName, className }: { appName: string; className?: string }) => (
  <p className={cn("flex min-w-0 items-center gap-1.5 text-xs", className)}>
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground uppercase"
    >
      {appName.trim().charAt(0)}
    </span>
    <span className="truncate font-semibold">{appName}</span>
    <BadgeCheck aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
    <span className="shrink-0 text-muted-foreground">{UI_COPY.board.officialLabel}</span>
  </p>
);

/** What a post shows: a decision card's announcement replaces the card's own title and body. */
const postText = (entry: FeedEntry): { title: string; body: string } =>
  entry.announcement ?? { title: entry.title, body: entry.body };

/** Type label of a regular post, or the app as author of an official one. */
const PostByline = ({ entry, appName }: { entry: FeedEntry; appName: string }) =>
  entry.announcement ? <OfficialAuthor appName={appName} /> : <TypeLabel type={entry.type} />;

interface NewestPostProps {
  entry: FeedEntry;
  appName: string;
  comments: CommentBatch | null;
  reveal: CommentReveal;
}

/**
 * Newest post: a card with the photo full-width on top, then type, title and body, then its
 * follower comments as they reveal (feed-comments D1, D4). Same card on every screen size
 * (feed-top-card D1, replaces feed-images D3); on a short feed box the photo is cropped (D2).
 */
const NewestPost = ({ entry, appName, comments, reveal }: NewestPostProps) => {
  // Juice anchor of `feed.landed`: the post's entrance per type is a recipe (juice-migrate D6).
  const anchor = useJuiceAnchor("feed:newest");
  // `comment.arrived` pops the newest shown comment (lap-3 D7).
  const latestComment = useJuiceAnchor("comment:latest");
  return (
    <li
      ref={anchor}
      data-variant="newest"
      data-official={entry.announcement ? "true" : undefined}
      className="flex flex-col overflow-hidden rounded-md bg-card text-card-foreground elevation-sm"
    >
      <PostArtwork entry={entry} compact={false} className={NEWEST_PHOTO_HEIGHT} />
      <div className="min-w-0 p-2.5">
        <PostByline entry={entry} appName={appName} />
        <p className="text-sm leading-snug font-bold">{postText(entry).title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{postText(entry).body}</p>
      </div>
      {comments && (
        <PostComments
          batch={comments}
          variant="full"
          shown={reveal.shown}
          reduced={reveal.reduced}
          latestRef={latestComment}
          className="mx-2.5 mb-2"
        />
      )}
    </li>
  );
};

/**
 * Older post: small photo, type and title; the body stays for screen readers (D2). Its comments
 * collapse to the first one plus "+N" (feed-comments D2).
 */
interface CompactPostProps {
  entry: FeedEntry;
  appName: string;
  comments: CommentBatch | null;
}

const CompactPost = ({ entry, appName, comments }: CompactPostProps) => (
  <li
    data-variant="compact"
    data-official={entry.announcement ? "true" : undefined}
    className="flex flex-col gap-1 rounded-md bg-card p-1.5 text-card-foreground elevation-sm"
  >
    <div className="flex items-center gap-2">
      <div className="w-16 shrink-0 overflow-hidden rounded-sm">
        <PostArtwork entry={entry} compact />
      </div>
      <div className="min-w-0">
        <PostByline entry={entry} appName={appName} />
        <p className="truncate text-sm leading-snug font-bold">{postText(entry).title}</p>
        <p className="sr-only">{postText(entry).body}</p>
      </div>
    </div>
    {comments && <PostComments batch={comments} variant="collapsed" className="ml-0.5" />}
  </li>
);

/**
 * Where a dragged card will land (event-juice-drop D4): a slot shaped like the newest post (photo
 * box on top, same artwork ratio) at the top of the list, so the posts move down instead of being
 * covered. Its height opens and closes through a grid-row transition on `duration-normal`
 * (instant under reduced motion). The feed keys it by the newest post, so it vanishes at once
 * when the dropped post takes its place.
 */
const DropSlot = ({ open, over }: { open: boolean; over: boolean }) => {
  // `card.over-feed` pulses the slot (lap-3 D4).
  const anchor = useJuiceAnchor("feed:drop");
  return (
    <div
      data-drop-slot={open ? "open" : "closed"}
      aria-hidden={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-(--duration-normal) ease-(--ease-standard)",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pb-2">
          <div
            ref={anchor}
            className={cn(
              "flex flex-col overflow-hidden rounded-md border-2 border-dashed border-primary/60 bg-primary/5 transition-colors duration-(--duration-fast)",
              over && "border-solid border-primary bg-primary/15"
            )}
          >
            <div className={NEWEST_PHOTO_HEIGHT} />
            {/* Text cell as tall as the newest post's type, title and body lines. */}
            <p className="flex min-h-22 items-center justify-center p-2.5 text-center text-sm font-semibold text-primary">
              Laat los om te plaatsen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PhoneFeedProps {
  entries: FeedEntry[];
  /** The player's app: the feed is its official account (app-name lap). */
  appName: string;
  /** Follower comments per session step (`FeedEntry.step`); null where a step has none. */
  comments: ReadonlyArray<CommentBatch | null>;
  /** The board's juice key: the newest post's comments reveal once it reaches their batch. */
  revealKey: number;
  /** A card is being dragged: open the drop slot. */
  dragging: boolean;
}

/**
 * The central smartphone feed: played cards land on top with their follower comments under them
 * (feed-comments D1). Also the drop target for dragging.
 */
export const PhoneFeed = ({ entries, appName, comments, revealKey, dragging }: PhoneFeedProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: FEED_DROP_ID });
  const listRef = useRef<HTMLDivElement>(null);
  const newestKey = entries[0]?.key;
  const commentsOf = (entry: FeedEntry): CommentBatch | null => comments[entry.step] ?? null;
  const newestComments = entries[0] ? commentsOf(entries[0]) : null;
  const reveal = useCommentReveal(newestComments, revealKey);
  useCommentArrivals(newestComments?.key ?? null, reveal.shown);

  // A new post lands on top, or a drag opens the slot there: bring the list back to the top (D5).
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [newestKey, dragging]);

  return (
    <section
      ref={setNodeRef}
      aria-label={fillTemplate(UI_COPY.board.feedLabel, { app: appName })}
      className={cn(
        "relative mx-auto flex min-h-24 w-full max-w-sm flex-1 board-desk:max-w-md flex-col overflow-hidden rounded-[1.75rem] border-4 border-border bg-background transition-shadow duration-(--duration-fast)",
        dragging && "border-dashed",
        isOver && "ring-4 ring-primary"
      )}
    >
      {/* The app's profile bar: the feed is its official account (app-name lap). */}
      <div className="flex shrink-0 items-center justify-center px-3 pt-1 pb-1.5">
        <OfficialAuthor appName={appName} className="max-w-full" />
      </div>
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5 [container-type:size]"
      >
        <DropSlot key={newestKey ?? "empty"} open={dragging} over={isOver} />
        {entries.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {UI_COPY.emptyStates.emptyFeed}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) =>
              index === 0 ? (
                <NewestPost
                  key={entry.key}
                  entry={entry}
                  appName={appName}
                  comments={newestComments}
                  reveal={reveal}
                />
              ) : (
                <CompactPost
                  key={entry.key}
                  entry={entry}
                  appName={appName}
                  comments={commentsOf(entry)}
                />
              )
            )}
          </ol>
        )}
      </div>
      <CommentAnnouncer announcement={reveal.announcement} />
    </section>
  );
};
