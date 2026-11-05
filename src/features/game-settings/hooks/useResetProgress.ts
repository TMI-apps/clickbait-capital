import { useCallback } from "react";
import { useSoundEffects } from "@/features/game-audio/api";
import { clearGameStorage } from "@/features/game-settings/services/gameStorage";
import { getMotionStore } from "@/features/game-settings/services/motionPreference";

/**
 * "Voortgang wissen": resets the live sound and motion state, then removes every game key
 * from this device. Nothing is stored server-side, so this is all there is to wipe.
 */
export const useResetProgress = (): (() => void) => {
  const { setMuted } = useSoundEffects();
  return useCallback(() => {
    setMuted(false);
    getMotionStore().reset();
    clearGameStorage();
  }, [setMuted]);
};
