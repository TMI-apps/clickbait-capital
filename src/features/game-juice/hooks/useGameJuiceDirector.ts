import { useMemo } from "react";
import { SOUND_EFFECT_IDS, useSoundEffects, type SoundEffectId } from "@/features/game-audio/api";
import { useReducedMotion } from "@/features/game-settings/api";
import { useJuiceDirector, type JuiceGates } from "@/features/juice-engine/api";
import type { SoundPort } from "@/features/juice-effects/api";
import {
  createGameJuiceEffects,
  gameJuiceBus,
  getGameJuiceTuning,
} from "@/features/game-juice/services/gameJuiceRuntime";

const isSoundEffectId = (id: string): id is SoundEffectId =>
  (SOUND_EFFECT_IDS as readonly string[]).includes(id);

/**
 * Plays the game's juice while mounted: every `emitJuice` event runs its recipe with the
 * inspector's tuning, sounds through game-audio (mute and unlock stay there), motion gated by
 * the Beweging setting (game-juice D3). Haptics are on until the player's "Trillen" setting
 * lands (juice-core D10).
 */
export function useGameJuiceDirector(): void {
  const reducedMotion = useReducedMotion();
  const { play } = useSoundEffects();
  const effects = useMemo(() => {
    const sound: SoundPort = (id, options) => {
      if (isSoundEffectId(id)) play(id, options);
    };
    return createGameJuiceEffects(sound);
  }, [play]);
  const gates = useMemo<JuiceGates>(() => ({ reducedMotion, haptics: true }), [reducedMotion]);
  useJuiceDirector({ listen: gameJuiceBus.listen, effects, tuning: getGameJuiceTuning(), gates });
}
