import { useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function reducedQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_QUERY)
    : null;
}

function subscribe(onChange: () => void): () => void {
  const query = reducedQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

const getReduced = (): boolean => reducedQuery()?.matches ?? false;

export interface MotionPreference {
  /** True: no shake, no particles, instant numbers; state changes still show. */
  reduced: boolean;
}

/**
 * The in-app motion preference — the one place game motion asks (game-juice D3). It follows
 * the OS `prefers-reduced-motion` today; the settings lap backs it with its motion toggle.
 */
export function useMotionPreference(): MotionPreference {
  const reduced = useSyncExternalStore(subscribe, getReduced, () => false);
  return { reduced };
}
