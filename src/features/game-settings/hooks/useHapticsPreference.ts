import { useState, useSyncExternalStore } from "react";
import {
  canVibrate,
  getHapticsStore,
  type HapticsStore,
} from "@/features/game-settings/services/hapticsPreference";

export interface UseHapticsPreferenceResult {
  /** True when the game may vibrate. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** This browser can vibrate at all (no vibration API on iOS). */
  available: boolean;
}

/** The player's "Trillen" choice, shared across the page. */
export const useHapticsPreference = (
  store: HapticsStore = getHapticsStore()
): UseHapticsPreferenceResult => {
  const enabled = useSyncExternalStore(store.subscribe, store.getEnabled, store.getEnabled);
  const [available] = useState(canVibrate);
  return { enabled, setEnabled: store.setEnabled, available };
};
