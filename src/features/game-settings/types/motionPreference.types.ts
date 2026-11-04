/** The player's motion choice: follow the OS, always reduce, or always play full juice. */
export const MOTION_PREFERENCES = ["system", "reduced", "full"] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

/** Page-wide motion state; one instance per page (`getMotionStore`). */
export interface MotionStore {
  getPreference: () => MotionPreference;
  setPreference: (preference: MotionPreference) => void;
  /** Back to "system" and forget the stored choice. */
  reset: () => void;
  /** True when animations should be reduced right now (choice + OS setting). */
  getReducedMotion: () => boolean;
  subscribe: (listener: () => void) => () => void;
}
