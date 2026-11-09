import { UI_COPY } from "@/features/game-content/api";
import type { FollowerTone } from "@/features/game-content/api";
import { useChatFeed } from "@/features/follower-chat/hooks/useChatFeed";
import type { ChatBatch, ChatMessage } from "@/features/follower-chat/types/followerChat.types";
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

const ChatLine = ({ message, reduced }: { message: ChatMessage; reduced: boolean }) => (
  <li
    data-kind={message.kind}
    className={cn(
      "flex min-w-0 items-center gap-1.5 text-xs leading-4",
      !reduced && "animate-juice-slide",
      message.kind === "leave" && "text-muted-foreground italic"
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full text-[0.625rem]",
        TONE_CLASS[message.tone]
      )}
    >
      {message.face}
    </span>
    <span className="min-w-0 truncate">
      {message.kind === "line" && <span className="font-bold">{message.name} </span>}
      {message.text}
    </span>
  </li>
);

export interface FollowerChatProps {
  /** The followers' reaction to the last action, or null before any. */
  batch: ChatBatch | null;
  /** Reveal the batch once this reaches `batch.key` (the board passes its juice key). */
  revealKey: number;
  className?: string;
}

/**
 * A livestream-style chat strip under the feed (follower-chat D1): the recurring followers
 * react line by line to each post and event choice. Fixed height, so the board never moves;
 * older lines slide out at the top. Not a live region: one polite announcement per batch.
 */
export const FollowerChat = ({ batch, revealKey, className }: FollowerChatProps) => {
  const chat = useChatFeed(batch, revealKey);
  return (
    <section
      aria-label={UI_COPY.chat.label}
      data-pace={chat.pace}
      className={cn(
        "relative mx-auto w-full max-w-sm shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted/60 px-2 py-1 transition-colors duration-(--duration-normal)",
        chat.pace === "wild" && "border-destructive/60",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 right-1.5 rounded-sm bg-destructive px-1 text-[0.625rem] leading-4 font-bold text-destructive-foreground uppercase"
      >
        ● {UI_COPY.chat.liveBadge}
      </span>
      <ol className="flex h-[3.25rem] flex-col justify-end gap-0.5 overflow-hidden pr-10">
        {chat.messages.length === 0 ? (
          <li className="text-xs leading-4 text-muted-foreground">{UI_COPY.chat.waiting}</li>
        ) : (
          chat.messages.map((message) => (
            <ChatLine key={message.key} message={message} reduced={chat.reduced} />
          ))
        )}
      </ol>
      <p aria-live="polite" data-chat-announcer className="sr-only">
        {chat.announcement && <span key={chat.announcement.key}>{chat.announcement.text}</span>}
      </p>
    </section>
  );
};
