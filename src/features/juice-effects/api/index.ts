/**
 * Public API of the juice effect library: one primitive per juice idea, each defined with
 * `defineJuiceEffect` (channel, reduced-motion form, tunable params). A game puts them in its
 * effect registry (`src/features/game-juice/services/gameJuiceRuntime.ts`).
 */
export {
  createSoundEffect,
  hapticEffect,
  hapticPattern,
} from "@/features/juice-effects/services/deviceEffects";
export {
  enterEffect,
  popEffect,
  pulseEffect,
  shakeEffect,
  timeWarpEffect,
  zoomEffect,
} from "@/features/juice-effects/services/motionEffects";
export {
  badgeEffect,
  flashEffect,
  glowEffect,
  tintEffect,
  tokenColor,
} from "@/features/juice-effects/services/overlayEffects";
export { particlePaths, splitGlyphs } from "@/features/juice-effects/services/particlePaths";
export type {
  ParticlePath,
  ParticlePathsOptions,
} from "@/features/juice-effects/services/particlePaths";
export {
  calloutEffect,
  floaterEffect,
  particleRoom,
  particlesEffect,
} from "@/features/juice-effects/services/stageEffects";
export type * from "@/features/juice-effects/types/juiceEffects.types";
