import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

/** How long a press must last before it counts as a hold (touch long-press convention). */
export const LONG_PRESS_MS = 350;

export interface LongPressOptions {
  /** The press lasted `LONG_PRESS_MS`: the hold starts. */
  onHoldStart: () => void;
  /** A started hold ended (release, cancel or the pointer left). */
  onHoldEnd: () => void;
}

export interface LongPressHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  /** Swallows the click that follows a hold, so a hold never also counts as a tap. */
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
  /** Blocks the long-press context menu (Android, desktop right-click hold). */
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Press-and-hold on any pointer (touch, mouse, pen): `onHoldStart` after `LONG_PRESS_MS`,
 * `onHoldEnd` on release. A short press stays a normal click; the click after a hold is
 * swallowed. Only the primary button counts. Compose the handlers with other pointer
 * listeners (e.g. a drag sensor) instead of replacing them.
 */
export function useLongPress({ onHoldStart, onHoldEnd }: LongPressOptions): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holding = useRef(false);
  const swallowClick = useRef(false);
  const callbacks = useRef({ onHoldStart, onHoldEnd });
  useEffect(() => {
    callbacks.current = { onHoldStart, onHoldEnd };
  });

  const release = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (!holding.current) return;
    holding.current = false;
    swallowClick.current = true;
    callbacks.current.onHoldEnd();
  }, []);

  // A hold still running when the element unmounts (the card was played) ends with it.
  useEffect(() => release, [release]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      release();
      swallowClick.current = false;
      timer.current = setTimeout(() => {
        timer.current = null;
        holding.current = true;
        callbacks.current.onHoldStart();
      }, LONG_PRESS_MS);
    },
    [release]
  );

  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
    onClickCapture,
    onContextMenu,
  };
}
