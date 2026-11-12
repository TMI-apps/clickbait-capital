/**
 * Public API of the juice engine: the game-agnostic runtime (bus, director, anchors, tuning,
 * stage). Effects live in `@/features/juice-effects/api`; the game's catalog and recipes in
 * `@/features/game-juice/api`.
 */
export { JuiceStage } from "@/features/juice-engine/components/JuiceStage";
export { useJuiceAnchor } from "@/features/juice-engine/hooks/useJuiceAnchor";
export { useJuiceDirector } from "@/features/juice-engine/hooks/useJuiceDirector";
export type { UseJuiceDirectorOptions } from "@/features/juice-engine/hooks/useJuiceDirector";
export { useJuiceTuning } from "@/features/juice-engine/hooks/useJuiceTuning";
export type { JuiceTuningView } from "@/features/juice-engine/hooks/useJuiceTuning";
export {
  findJuiceAnchor,
  getJuiceStage,
  registerJuiceAnchor,
  registerJuiceStage,
} from "@/features/juice-engine/services/juiceAnchors";
export { createJuiceBus } from "@/features/juice-engine/services/juiceBus";
export type { JuiceBus, JuiceListener } from "@/features/juice-engine/services/juiceBus";
export {
  createJuiceDirector,
  fillJuiceTemplate,
  gateJuiceStep,
  juiceRecipeSteps,
} from "@/features/juice-engine/services/juiceDirector";
export type {
  JuiceDirector,
  JuiceDirectorOptions,
} from "@/features/juice-engine/services/juiceDirector";
export {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  stepNumber,
  stepText,
} from "@/features/juice-engine/services/juiceEffect";
export type { JuiceEffectDefinition } from "@/features/juice-engine/services/juiceEffect";
export {
  DEFAULT_JUICE_TUNING,
  JUICE_TUNING_RANGES,
  applyJuiceOverrides,
  createJuiceTuning,
  juiceStepKey,
  parseJuiceOverrides,
} from "@/features/juice-engine/services/juiceTuning";
export type {
  JuiceTuningOptions,
  JuiceTuningStorage,
  JuiceTuningStore,
} from "@/features/juice-engine/services/juiceTuning";
export type * from "@/features/juice-engine/types/juiceEngine.types";
export { parseDurationMs, readDurationToken } from "@/features/juice-engine/services/juiceEffect";
