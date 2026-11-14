import type { RunAction, SavedRun } from "@/features/game-save/types/savedRun.types";
import { SAVED_RUN_VERSION } from "@/features/game-save/types/savedRun.types";

/**
 * localStorage key of the saved run. It starts with the game-settings `GAME_STORAGE_PREFIX`,
 * so "Voortgang wissen" removes it; the version in the key lets a new schema ignore old saves.
 */
export const SAVED_RUN_KEY = `clickbait-capital:run:v${SAVED_RUN_VERSION}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const isRunAction = (value: unknown): value is RunAction => {
  if (!isRecord(value)) return false;
  if (value.kind === "card") return isId(value.cardId);
  return value.kind === "option" && isId(value.optionId);
};

/** Shape check only; whether the actions are legal is decided by replaying them (game-session). */
export const isSavedRun = (value: unknown): value is SavedRun =>
  isRecord(value) &&
  value.version === SAVED_RUN_VERSION &&
  Number.isSafeInteger(value.seed) &&
  Array.isArray(value.actions) &&
  value.actions.every(isRunAction) &&
  (value.appName === undefined || typeof value.appName === "string");

/** Removes the saved run. Blocked storage removes nothing (local-save D7). */
export const clearSavedRun = (): void => {
  try {
    window.localStorage.removeItem(SAVED_RUN_KEY);
  } catch {
    // Storage unavailable: nothing was saved either.
  }
};

/**
 * The saved run, or null. Corrupt JSON or a wrong shape is removed so it is never offered
 * again (local-save D2); blocked storage reads as "no save".
 */
export const readSavedRun = (): SavedRun | null => {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(SAVED_RUN_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSavedRun(parsed)) return parsed;
  } catch {
    // Corrupt JSON: discarded below.
  }
  clearSavedRun();
  return null;
};

/** Stores the run; a full or blocked storage only loses the save, never the game (D7). */
export const writeSavedRun = (run: SavedRun): void => {
  try {
    window.localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(run));
  } catch {
    // Storage unavailable: the run plays on without a save.
  }
};
