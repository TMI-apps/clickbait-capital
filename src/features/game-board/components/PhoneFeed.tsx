import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Megaphone, Newspaper, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GameCardArtwork } from "@/components/common/GameCard";
import type { GameCardImage } from "@/components/common/GameCard";
import { getCardImage } from "@/features/card-imagery/api";
import type { FeedEntry } from "@/features/game-board/types/gameBoard.types";
import { UI_COPY } from "@/features/game-content/api";
import { FEED_ENTRANCE } from "@/features/game-juice/api";
import { cn } from "@/shared/utils/cn";

/** Drop target id the draft cards are dragged onto. */
export const FEED_DROP_ID = "feed";

const POST_STYLE: Record<FeedEntry["type"], { label: string; icon: LucideIcon; frame: string }> = {
  viral: { label: "Viraal", icon: Zap, frame: "border-type-viral" },
  ad: { label: "Advertentie", icon: Megaphone, frame: "border-type-ad" },
  news: { label: "Nieuws", icon: Newspaper, frame: "border-type-news" },
  event: { label: "Gebeurtenis", icon: Siren, frame: "border-type-event" },
};

/**
 * The entry's picture in the kit's card artwork (same image path as the draft: lazy, focal
 * point, ThumbnailFrame except on news, type-icon placeholder; feed-images D1). A compact row
 * drops caption, sticker and marker, which are unreadable at 64 px (D4).
 */
const PostArtwork = ({ entry, compact }: { entry: FeedEntry; compact: boolean }) => {
  const image = getCardImage(entry.contentId);
  const shown: GameCardImage | undefined =
    image && compact ? { ...image, thumbnail: undefined } : (image ?? undefined);
  return <GameCardArtwork type={entry.type} image={shown} />;
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
 * Newest post: photo plus type, title and body. The feed box is a size container (D3): the
 * photo sits on top when the box is tall enough, beside the text otherwise, so the whole post
 * stays visible without scrolling.
 */
const NewestPost = ({ entry }: { entry: FeedEntry }) => (
  <li
    data-variant="newest"
    className={cn(
      "grid grid-cols-[45%_1fr] overflow-hidden rounded-md border-l-4 bg-card text-card-foreground elevation-sm [@container(min-height:24rem)]:grid-cols-1",
      POST_STYLE[entry.type].frame,
      FEED_ENTRANCE[entry.type]
    )}
  >
    <div className="self-start">
      <PostArtwork entry={entry} compact={false} />
    </div>
    <div className="min-w-0 p-2.5">
      <TypeLabel type={entry.type} />
      <p className="text-sm leading-snug font-bold">{entry.title}</p>
      <p className="line-clamp-3 text-xs text-muted-foreground [@container(min-height:24rem)]:line-clamp-2">
        {entry.body}
      </p>
    </div>
  </li>
);

/** Older post: small photo, type and title; the body stays for screen readers (D2). */
const CompactPost = ({ entry }: { entry: FeedEntry }) => (
  <li
    data-variant="compact"
    className={cn(
      "flex items-center gap-2 rounded-md border-l-4 bg-card p-1.5 text-card-foreground elevation-sm",
      POST_STYLE[entry.type].frame
    )}
  >
    <div className="w-16 shrink-0 overflow-hidden rounded-sm">
      <PostArtwork entry={entry} compact />
    </div>
    <div className="min-w-0">
      <TypeLabel type={entry.type} />
      <p className="truncate text-sm leading-snug font-bold">{entry.title}</p>
      <p className="sr-only">{entry.body}</p>
    </div>
  </li>
);

export interface PhoneFeedProps {
  entries: FeedEntry[];
  /** A card is being dragged: show the drop hint. */
  dragging: boolean;
}

/** The central smartphone feed: played cards land on top. Also the drop target for dragging. */
export const PhoneFeed = ({ entries, dragging }: PhoneFeedProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: FEED_DROP_ID });
  const listRef = useRef<HTMLDivElement>(null);
  const newestKey = entries[0]?.key;

  // A new post lands on top: bring the list back there so it is visible (D5).
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [newestKey]);

  return (
    <section
      ref={setNodeRef}
      aria-label={UI_COPY.board.feedLabel}
      className={cn(
        "relative mx-auto flex min-h-24 w-full max-w-sm flex-1 flex-col overflow-hidden rounded-[1.75rem] border-4 border-border bg-background transition-shadow duration-(--duration-fast)",
        dragging && "border-dashed",
        isOver && "ring-4 ring-primary"
      )}
    >
      <div className="flex shrink-0 justify-center py-1.5" aria-hidden="true">
        <span className="h-1.5 w-16 rounded-full bg-border" />
      </div>
      {dragging && (
        <p className="absolute inset-x-2.5 top-6 z-10 rounded-md border border-dashed border-primary bg-background/95 p-2 text-center text-sm font-semibold text-primary">
          Laat los om te plaatsen
        </p>
      )}
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5 [container-type:size]"
      >
        {entries.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {UI_COPY.emptyStates.emptyFeed}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) =>
              index === 0 ? (
                <NewestPost key={entry.key} entry={entry} />
              ) : (
                <CompactPost key={entry.key} entry={entry} />
              )
            )}
          </ol>
        )}
      </div>
    </section>
  );
};
