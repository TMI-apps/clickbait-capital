import { useEffect } from "react";
import { useSoundEffects } from "@/features/game-audio/api";
import type { BoardSounds } from "@/features/game-board/services/boardSounds";

/** Gap between the action sound and its follow-up (milestone or meter blip), in ms. */
export const SOUND_STAGGER_MS = 250;

/**
 * Plays the sounds of the last board action once, in order, the follow-up slightly after the
 * action so they don't mask each other. Muting and the gesture unlock live in game-audio.
 */
export function useBoardSounds({ ids, key }: BoardSounds): void {
  const { play } = useSoundEffects();

  useEffect(() => {
    const timers = ids.map((id, index) =>
      window.setTimeout(() => play(id), index * SOUND_STAGGER_MS)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // `key` marks a new action; `ids` alone can repeat between actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, play]);
}
