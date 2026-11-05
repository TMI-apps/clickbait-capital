/**
 * Public API of the game-save feature: the run saved on this device and how `/spel` starts.
 * Other features and pages import only from here (`@/features/game-save/api`).
 */
export { useRunStart } from "@/features/game-save/hooks/useRunStart";
export type { RunStartChoice, RunStartState } from "@/features/game-save/hooks/useRunStart";
export {
  clearSavedRun,
  readSavedRun,
  writeSavedRun,
} from "@/features/game-save/services/savedRunStorage";
export { SAVED_RUN_VERSION } from "@/features/game-save/types/savedRun.types";
export type { RunAction, RunStart, SavedRun } from "@/features/game-save/types/savedRun.types";
