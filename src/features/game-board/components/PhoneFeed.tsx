import { useDroppable } from "@dnd-kit/core";
import { Megaphone, Newspaper, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const FeedPost = ({ entry, isNewest }: { entry: FeedEntry; isNewest: boolean }) => {
  const style = POST_STYLE[entry.type];
  return (
    <li
      className={cn(
        "rounded-md border-l-4 bg-card p-2.5 text-card-foreground elevation-sm",
        style.frame,
        isNewest && FEED_ENTRANCE[entry.type]
      )}
    >
      <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <style.icon aria-hidden="true" className="size-3.5" />
        {style.label}
      </p>
      <p className="text-sm leading-snug font-bold">{entry.title}</p>
      <p className="text-xs text-muted-foreground">{entry.body}</p>
    </li>
  );
};

export interface PhoneFeedProps {
  entries: FeedEntry[];
  /** A card is being dragged: show the drop hint. */
  dragging: boolean;
}

/** The central smartphone feed: played cards land on top. Also the drop target for dragging. */
export const PhoneFeed = ({ entries, dragging }: PhoneFeedProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: FEED_DROP_ID });
  return (
    <section
      ref={setNodeRef}
      aria-label={UI_COPY.board.feedLabel}
      className={cn(
        "mx-auto flex min-h-24 w-full max-w-sm flex-1 flex-col overflow-hidden rounded-[1.75rem] border-4 border-border bg-background transition-shadow duration-(--duration-fast)",
        dragging && "border-dashed",
        isOver && "ring-4 ring-primary"
      )}
    >
      <div className="flex shrink-0 justify-center py-1.5" aria-hidden="true">
        <span className="h-1.5 w-16 rounded-full bg-border" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5">
        {dragging && (
          <p className="mb-2 rounded-md border border-dashed border-primary p-2 text-center text-sm font-semibold text-primary">
            Laat los om te plaatsen
          </p>
        )}
        {entries.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {UI_COPY.emptyStates.emptyFeed}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <FeedPost key={entry.key} entry={entry} isNewest={index === 0} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};
