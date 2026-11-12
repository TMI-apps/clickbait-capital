import { useLayoutEffect, useRef, useState } from "react";
import { emitJuiceEvent } from "@/features/game-juice/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import type { BoardJuice } from "@/features/game-board/services/boardJuice";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

/**
 * Emits a list once each time `key` changes, never for the key present at mount (a resume or a
 * return from a phase intro stays quiet, game-juice D1). Layout effect: an entrance starts
 * before the first paint, and anchors registered by refs in this render are already there.
 */
function useEmitOnKey(key: number, emits: BoardJuice["followUp"]): void {
  const emitted = useRef(key);
  useLayoutEffect(() => {
    if (key === emitted.current) return;
    emitted.current = key;
    emits.forEach(emitJuiceEvent);
    // `key` marks a new action; the list belongs to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Plays what each action led to (run end, next phase, a new event) at once (juice-migrate D2). */
export function useBoardFollowUp({ key, followUp }: BoardJuice): void {
  useEmitOnKey(key, followUp);
}

export interface UseBoardRevealOptions {
  /** Changes once per action (the feed length, as the comments' reveal key). */
  key: number;
  reveal: BoardJuice["reveal"];
  meters: MeterView[];
  /** Keep showing the action before this one while true (its event dialog is closing). */
  hold: boolean;
}

export interface BoardReveal {
  /** The meters as they should show: held on the pre-choice view while `hold` is set. */
  meters: MeterView[];
  /** The shown action's key: restarts the delta chips and reveals the newest comments. */
  revealKey: number;
  /** Ref for the board root: the juice anchor `board` (the viral shake). */
  boardRef: (element: Element | null) => (() => void) | undefined;
}

type Shown = Pick<UseBoardRevealOptions, "key" | "reveal" | "meters">;

/**
 * The board's per-action reveal: outcome, meter flashes and the new post play once the event
 * dialog has closed, so they happen in sight (event-juice-drop D3). Meanwhile the meters keep
 * the pre-choice view.
 * Second copy of the shown-value pattern: `src/shared/hooks/useRetainedValue.ts` keeps the last non-null value,
 * this keeps the last value while `hold` is set; extract to `src/shared/hooks/` at a third.
 */
export function useBoardReveal({ hold, ...current }: UseBoardRevealOptions): BoardReveal {
  const [shown, setShown] = useState<Shown>(current);
  if (!hold && current.key !== shown.key) setShown(current);
  const visible = hold ? shown : current;
  useEmitOnKey(visible.key, visible.reveal);
  const boardRef = useJuiceAnchor("board");
  return { meters: visible.meters, revealKey: visible.key, boardRef };
}
