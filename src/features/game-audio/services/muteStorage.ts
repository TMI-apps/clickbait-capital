/** localStorage key for the player's mute choice. */
export const MUTE_STORAGE_KEY = "clickbait-capital:audio-muted";

/**
 * Reads the remembered mute choice. Storage can be missing or throw (private mode, blocked
 * site data); then the game starts with sound on, which still stays silent until a gesture.
 */
export const readStoredMuted = (): boolean => {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

/** Remembers the mute choice; a failing storage only loses the memory, never the toggle. */
export const storeMuted = (muted: boolean): void => {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Storage unavailable: the choice holds for this page only.
  }
};
