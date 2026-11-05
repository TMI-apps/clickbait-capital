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
