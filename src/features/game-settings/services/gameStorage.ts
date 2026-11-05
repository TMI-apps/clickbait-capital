/**
 * Prefix of every `localStorage` key that holds game data on this device (mute, motion,
 * saved runs). New game keys must use it so "Voortgang wissen" clears them. The colour
 * mode key (`color-mode`) is a display preference and deliberately not prefixed.
 */
export const GAME_STORAGE_PREFIX = "clickbait-capital:";

/** Removes every game key; returns how many were removed. Blocked storage removes nothing. */
export const clearGameStorage = (storage?: Storage): number => {
  try {
    const target = storage ?? window.localStorage;
    const keys = Array.from({ length: target.length }, (_, index) => target.key(index)).filter(
      (key): key is string => key !== null && key.startsWith(GAME_STORAGE_PREFIX)
    );
    keys.forEach((key) => target.removeItem(key));
    return keys.length;
  } catch {
    return 0;
  }
};
