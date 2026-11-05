import { useReducedMotion } from "@/features/game-settings/api";

export interface MotionPreference {
  /** True: no shake, no particles, instant numbers; state changes still show. */
  reduced: boolean;
}

/**
 * Game juice's view of the motion setting (game-juice D3). Delegates to game-settings'
 * `useReducedMotion`, the one in-app source: "Verminderd" reduces, "Volledig" plays full juice,
 * "Systeem" follows `prefers-reduced-motion`. Internal to game-juice; other features read
 * `@/features/game-settings/api` directly.
 */
export function useMotionPreference(): MotionPreference {
  return { reduced: useReducedMotion() };
}
