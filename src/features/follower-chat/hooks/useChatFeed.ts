import { useEffect, useState } from "react";
import { fillTemplate, UI_COPY } from "@/features/game-content/api";
import { useReducedMotion } from "@/features/game-settings/api";
import type {
  ChatBatch,
  ChatMessage,
  ChatPace,
} from "@/features/follower-chat/types/followerChat.types";

/** Lines kept in the chat; older ones scroll out of the strip. */
export const CHAT_LOG_SIZE = 6;

/** Time between two lines of one batch: a toxic chat runs faster (follower-chat D3). */
export const CHAT_STAGGER_MS: Record<ChatPace, number> = { calm: 550, busy: 350, wild: 200 };

/**
 * The chat's one announcement goes out after its last line and at least this long after the
 * action, so it follows the board's turn summary (sent 150 ms after focus moves).
 */
export const CHAT_ANNOUNCE_AFTER_MS = 600;

export interface ChatFeed {
  /** Lines to show, oldest first. */
  messages: ChatMessage[];
  /** One polite screen-reader text per batch (the first line), keyed per batch; null when quiet. */
  announcement: { key: number; text: string } | null;
  pace: ChatPace;
  /** Under reduced motion lines appear together without entrance motion. */
  reduced: boolean;
}

const appendMessage = (log: ChatMessage[], message: ChatMessage): ChatMessage[] =>
  log.some((shown) => shown.key === message.key) ? log : [...log, message].slice(-CHAT_LOG_SIZE);

/**
 * Reveals each batch line by line once `revealKey` reaches the batch key — the board passes
 * the juice key, so after an event the chat waits for the dialog to close like the meter juice
 * (event-juice-drop D3). Nothing plays for the batch present at mount (a phase intro return or
 * a resume), and a new run (no batch) clears the log.
 */
export function useChatFeed(batch: ChatBatch | null, revealKey: number): ChatFeed {
  const reduced = useReducedMotion();
  const [mountKey] = useState(revealKey);
  const [log, setLog] = useState<ChatMessage[]>([]);
  const [announcedKey, setAnnouncedKey] = useState<number | null>(null);
  const live = liveBatch(batch, revealKey, mountKey);
  if (batch === null && log.length > 0) setLog([]);

  useEffect(() => {
    if (!live) return undefined;
    const gap = reduced ? 0 : CHAT_STAGGER_MS[live.pace];
    const timers = live.messages.map((message, index) =>
      window.setTimeout(() => setLog((current) => appendMessage(current, message)), index * gap)
    );
    const lastLineAt = Math.max(0, live.messages.length - 1) * gap;
    timers.push(
      window.setTimeout(
        () => setAnnouncedKey(live.key),
        Math.max(lastLineAt, CHAT_ANNOUNCE_AFTER_MS)
      )
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [live, reduced]);

  return {
    messages: log,
    announcement: announcementFor(live, announcedKey),
    pace: batch?.pace ?? "calm",
    reduced,
  };
}

/** The batch to play now: it reached the reveal key and was not already there at mount. */
function liveBatch(batch: ChatBatch | null, revealKey: number, mountKey: number): ChatBatch | null {
  return batch !== null && batch.key === revealKey && revealKey !== mountKey ? batch : null;
}

function announcementFor(
  live: ChatBatch | null,
  announcedKey: number | null
): ChatFeed["announcement"] {
  const first = live?.messages[0];
  if (!live || !first || announcedKey !== live.key) return null;
  return { key: live.key, text: announcementText(first) };
}

function announcementText(message: ChatMessage): string {
  return message.kind === "leave"
    ? message.text
    : fillTemplate(UI_COPY.chat.announcement, { name: message.name, text: message.text });
}
