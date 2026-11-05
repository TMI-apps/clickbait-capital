import { useCallback, useEffect, useRef, useState } from "react";
import { describeTurn, type TurnSnapshot } from "@/features/game-board/services/turnAnnouncement";
import type { BoardView } from "@/features/game-board/types/gameBoard.types";

/** The heading of the playing board; focused when the board opens after a phase intro. */
export const BOARD_HEADING_ID = "board-heading";

/** Playable cards of the open draft, in slot order (not the card in the details dialog). */
const DRAFT_CARD_SELECTOR = '[data-draft-card] [data-slot="game-card"]';

const focusLost = (): boolean =>
  document.activeElement === null || document.activeElement === document.body;

function toSnapshot(view: BoardView): TurnSnapshot {
  return {
    latest: view.feed[0] ?? null,
    meters: view.meters,
    goalStats: view.phase.goalStats,
    streak: view.phase.streak,
    drought: view.draft.some((card) => card.droughtWarning),
  };
}

/**
 * The polite announcement of the last action (screen-reader D1). Empty until the first action
 * after mount, so returning to the board after a phase intro doesn't repeat the old turn.
 */
function useTurnAnnouncement(view: BoardView): { text: string; key: number } {
  const key = view.feed.length;
  const snapshot = toSnapshot(view);
  const [mountKey] = useState(key);
  // The last action's snapshot and the one before it (for "drought started").
  const [turns, setTurns] = useState<{
    key: number;
    current: TurnSnapshot;
    previous: TurnSnapshot | null;
  }>({ key, current: snapshot, previous: null });
  if (turns.key !== key) {
    setTurns({ key, current: snapshot, previous: turns.current });
  }
  const previous = turns.key === key ? turns.previous : turns.current;
  return { text: key === mountKey ? "" : describeTurn(snapshot, previous), key };
}

/**
 * Keeps focus on the board (screen-reader D2). A played card unmounts, so without this focus
 * falls to <body> and the reader restarts at the top: the board heading on open, then the card
 * in the same draft slot after every play.
 */
function useBoardFocus(draftKey: string): {
  rememberSlot: (index: number) => void;
  focusDraftSlot: () => void;
} {
  const slot = useRef(0);

  const focusDraftSlot = useCallback(() => {
    const cards = document.querySelectorAll<HTMLElement>(DRAFT_CARD_SELECTOR);
    (cards[slot.current] ?? cards[0])?.focus();
  }, []);

  useEffect(() => {
    if (focusLost()) document.getElementById(BOARD_HEADING_ID)?.focus();
  }, []);

  useEffect(() => {
    if (focusLost()) focusDraftSlot();
  }, [draftKey, focusDraftSlot]);

  const rememberSlot = useCallback((index: number) => {
    slot.current = Math.max(0, index);
  }, []);

  return { rememberSlot, focusDraftSlot };
}

export interface BoardScreenReader {
  /** Text for the board's polite live region; key its child on `key` so a repeat is re-read. */
  announcement: { text: string; key: number };
  /** Call before a card leaves the draft: focus returns to this slot. */
  rememberSlot: (index: number) => void;
  /** Focus the card in the remembered slot (e.g. after an event answer). */
  focusDraftSlot: () => void;
}

/**
 * What screen-reader players need from the playing board beyond its markup: one announcement
 * per action and focus that stays in the draft between turns.
 */
export function useBoardScreenReader(view: BoardView): BoardScreenReader {
  const announcement = useTurnAnnouncement(view);
  const focus = useBoardFocus(view.draft.map((card) => card.id).join());
  return { announcement, ...focus };
}
