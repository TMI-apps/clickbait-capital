import { useEffect, useMemo } from "react";
import { SOUND_EFFECT_IDS, useSoundEffects, type SoundEffectId } from "@/features/game-audio/api";
import {
  onGameStorageCleared,
  useHapticsPreference,
  useReducedMotion,
} from "@/features/game-settings/api";
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
 * the Beweging setting (game-juice D3), vibration by the Trillen setting (default on,
 * juice-core D10). "Voortgang wissen" also drops the inspector's tuning kept in memory.
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
  const { enabled: haptics } = useHapticsPreference();
  const gates = useMemo<JuiceGates>(() => ({ reducedMotion, haptics }), [reducedMotion, haptics]);
  const tuning = getGameJuiceTuning();
  useEffect(() => onGameStorageCleared(tuning.reload), [tuning]);
  useJuiceDirector({
    listen: gameJuiceBus.listen,
    listenStop: gameJuiceBus.listenStop,
    effects,
    tuning,
    gates,
  });
}
