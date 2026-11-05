import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export interface SafeUpdateMomentOptions {
  /** A new version is downloaded and waiting. */
  updateReady: boolean;
  /** Activates the waiting version and reloads the page into it. */
  applyUpdate: () => void;
}

const INPUT_EVENTS = ["pointerdown", "keydown"] as const;

/**
 * Applies a waiting update only when it can't interrupt play (app-update-flow D1): before the
 * player's first input since this page load, or on a route change (leaving `/spel` has paused
 * the run, and arriving somewhere new has nothing in progress yet). A run is saved on the device
 * (local-save D6), so a reload no longer loses it, but mid-turn it would still drop the player
 * onto the resume offer. Otherwise the caller keeps showing the prompt.
 */
export const useSafeUpdateMoment = ({
  updateReady,
  applyUpdate,
}: SafeUpdateMomentOptions): void => {
  const { pathname } = useLocation();
  const [hasInteracted, setHasInteracted] = useState(false);
  const readyOnPath = useRef<string | null>(null);

  useEffect(() => {
    if (hasInteracted) return undefined;
    const markInteracted = (): void => setHasInteracted(true);
    INPUT_EVENTS.forEach((type) => window.addEventListener(type, markInteracted, true));
    return () =>
      INPUT_EVENTS.forEach((type) => window.removeEventListener(type, markInteracted, true));
  }, [hasInteracted]);

  useEffect(() => {
    if (!updateReady) {
      readyOnPath.current = null;
      return;
    }
    readyOnPath.current ??= pathname;
    if (!hasInteracted || readyOnPath.current !== pathname) applyUpdate();
  }, [updateReady, hasInteracted, pathname, applyUpdate]);
};
