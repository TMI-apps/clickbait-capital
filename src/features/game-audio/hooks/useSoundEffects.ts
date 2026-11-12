import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getSoundPlayer } from "@/features/game-audio/services/soundPlayer";
import type {
  SoundEffectId,
  SoundPlayOptions,
  SoundPlayer,
} from "@/features/game-audio/types/soundEffect.types";

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

export interface UseSoundEffectsResult {
  /** Plays a sound by id; silent while muted or before the first user gesture. */
  play: (id: SoundEffectId, options?: SoundPlayOptions) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

/**
 * Game sound effects for any component. Unlocks audio on the first pointer or key gesture
 * anywhere on the page (browser autoplay rules) and shares the mute state across components.
 */
export const useSoundEffects = (player: SoundPlayer = getSoundPlayer()): UseSoundEffectsResult => {
  const muted = useSyncExternalStore(player.subscribe, player.isMuted, player.isMuted);

  useEffect(() => {
    if (player.isUnlocked()) return;
    const onGesture = (): void => {
      void player.unlock();
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, onGesture));
    };
    UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, onGesture));
    return () => UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, onGesture));
  }, [player]);

  const play = useCallback(
    (id: SoundEffectId, options?: SoundPlayOptions) => player.play(id, options),
    [player]
  );
  const setMuted = useCallback((next: boolean) => player.setMuted(next), [player]);
  const toggleMuted = useCallback(() => player.setMuted(!player.isMuted()), [player]);

  return { play, muted, setMuted, toggleMuted };
};
