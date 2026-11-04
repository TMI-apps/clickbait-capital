/**
 * Public API of the game-audio feature. Other features and pages import only from here
 * (`@/features/game-audio/api`), e.g. `const { play } = useSoundEffects(); play("card-viral")`.
 */
export { MuteToggle } from "@/features/game-audio/components/MuteToggle";
export type { MuteToggleProps } from "@/features/game-audio/components/MuteToggle";
export { useSoundEffects } from "@/features/game-audio/hooks/useSoundEffects";
export type { UseSoundEffectsResult } from "@/features/game-audio/hooks/useSoundEffects";
export {
  AUDIO_CREDIT_LINE,
  SOUND_MANIFEST,
  SOUND_STYLE,
} from "@/features/game-audio/services/soundManifest";
export { SOUND_EFFECT_IDS } from "@/features/game-audio/types/soundEffect.types";
export type {
  SoundEffectId,
  SoundManifestEntry,
} from "@/features/game-audio/types/soundEffect.types";
