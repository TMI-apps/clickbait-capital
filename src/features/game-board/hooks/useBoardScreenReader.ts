import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeResume,
  describeTurn,
  type TurnSnapshot,
} from "@/features/game-board/services/boardSpeech";
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

/** Wait after an action before speaking, so the focus move to the next card is read first. */
const ANNOUNCE_DELAY_MS = 150;

/**
 * The polite announcement of the last actions (screen-reader D1). Texts queue while `blocked`
 * (an event dialog is open or still animating out: it hides the rest of the page from screen
 * readers), then go out together once, after the focus move. Nothing from before mount repeats,
 * except where a resumed run stands (local-save D5), which is the first text of the queue.
 */
function useTurnAnnouncement(
  view: BoardView,
  blocked: boolean,
  resumed: boolean
): { text: string; key: number } {
  const key = view.feed.length;
  const snapshot = toSnapshot(view);
  // The last action's snapshot (for "drought started") and the texts not yet spoken.
  const [turns, setTurns] = useState<{ key: number; current: TurnSnapshot; pending: string[] }>(
    () => ({
      key,
      current: snapshot,
      pending: resumed ? [describeResume(view.phase, view.meters)] : [],
    })
  );
  if (turns.key !== key) {
    const text = describeTurn(snapshot, turns.current);
    setTurns({ key, current: snapshot, pending: [...turns.pending, text] });
  }
  const [spoken, setSpoken] = useState({ text: "", key: 0 });

  useEffect(() => {
    if (blocked || turns.pending.length === 0) return;
    const timer = window.setTimeout(() => {
      setSpoken((last) => ({ text: turns.pending.join(" "), key: last.key + 1 }));
      setTurns((current) => ({ ...current, pending: [] }));
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [blocked, turns.pending]);

  return spoken;
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
 * per action and focus that stays in the draft between turns. `dialogOpen`: an answer-only
 * dialog is mounted (including its closing animation). `resumed`: the board opens on a saved run.
 */
export function useBoardScreenReader(
  view: BoardView,
  dialogOpen: boolean,
  resumed = false
): BoardScreenReader {
  const announcement = useTurnAnnouncement(view, dialogOpen, resumed);
  const focus = useBoardFocus(view.draft.map((card) => card.id).join());
  return { announcement, ...focus };
}
