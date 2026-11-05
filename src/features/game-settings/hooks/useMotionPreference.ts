import { useSyncExternalStore } from "react";
import { getMotionStore } from "@/features/game-settings/services/motionPreference";
import type {
  MotionPreference,
  MotionStore,
} from "@/features/game-settings/types/motionPreference.types";

export interface UseMotionPreferenceResult {
  preference: MotionPreference;
  setPreference: (preference: MotionPreference) => void;
  /** True when animations should be reduced right now (choice + OS setting). */
  reducedMotion: boolean;
}

/** The player's motion choice and its resolved value, shared across the page. */
export const useMotionPreference = (
  store: MotionStore = getMotionStore()
): UseMotionPreferenceResult => {
  const preference = useSyncExternalStore(
    store.subscribe,
    store.getPreference,
    store.getPreference
  );
  const reducedMotion = useSyncExternalStore(
    store.subscribe,
    store.getReducedMotion,
    store.getReducedMotion
  );
  return { preference, setPreference: store.setPreference, reducedMotion };
};

/**
 * True when animations should be reduced. Read this in every animation (screen shake,
 * confetti, count-ups) instead of querying `prefers-reduced-motion` directly.
 */
export const useReducedMotion = (store: MotionStore = getMotionStore()): boolean =>
  useSyncExternalStore(store.subscribe, store.getReducedMotion, store.getReducedMotion);
