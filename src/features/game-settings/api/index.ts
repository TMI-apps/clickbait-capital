/**
 * Public API of the game-settings feature. Other features and pages import only from here
 * (`@/features/game-settings/api`). Animations read `useReducedMotion()`.
 */
export { SettingsPanel } from "@/features/game-settings/components/SettingsPanel";
export {
  useMotionPreference,
  useReducedMotion,
} from "@/features/game-settings/hooks/useMotionPreference";
export type { UseMotionPreferenceResult } from "@/features/game-settings/hooks/useMotionPreference";
export { getMotionStore } from "@/features/game-settings/services/motionPreference";
export { GAME_STORAGE_PREFIX } from "@/features/game-settings/services/gameStorage";
export { MOTION_PREFERENCES } from "@/features/game-settings/types/motionPreference.types";
export type {
  MotionPreference,
  MotionStore,
} from "@/features/game-settings/types/motionPreference.types";
export { useHapticsPreference } from "@/features/game-settings/hooks/useHapticsPreference";
export type { UseHapticsPreferenceResult } from "@/features/game-settings/hooks/useHapticsPreference";
export { canVibrate, getHapticsStore } from "@/features/game-settings/services/hapticsPreference";
export type { HapticsStore } from "@/features/game-settings/services/hapticsPreference";
export { onGameStorageCleared } from "@/features/game-settings/services/gameStorage";
