import { GAME_STORAGE_PREFIX } from "@/features/game-settings/services/gameStorage";

export const HAPTICS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}haptics`;

/** Page-wide vibration choice ("Trillen"); one instance per page (`getHapticsStore`). */
export interface HapticsStore {
  /** True when the game may vibrate (default on). */
  getEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
  /** Back to on and forget the stored choice. */
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
}

export interface HapticsStoreDeps {
  read: () => string | null;
  write: (value: string | null) => void;
}

/**
 * The player's "Trillen" choice, shared by the settings screen and the juice (game-juice gates
 * every vibration step on it). Default on: the owner chose vibration on key moments with an off
 * switch (juice-core Q1). Second copy of a stored on/off page setting next to game-audio's mute
 * (`src/features/game-audio/services/muteStorage.ts`); extract a shared toggle store at a third.
 */
export const createHapticsStore = (deps: HapticsStoreDeps): HapticsStore => {
  let enabled = deps.read() !== "off";
  const listeners = new Set<() => void>();
  const update = (next: boolean, stored: string | null): void => {
    enabled = next;
    deps.write(stored);
    listeners.forEach((listener) => listener());
  };
  return {
    getEnabled: () => enabled,
    setEnabled: (next) => update(next, next ? "on" : "off"),
    reset: () => update(true, null),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

/** True when this browser can vibrate at all (Android; iOS browsers have no vibration API). */
export const canVibrate = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const readStorage = (): string | null => {
  try {
    return window.localStorage.getItem(HAPTICS_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (value: string | null): void => {
  try {
    if (value === null) window.localStorage.removeItem(HAPTICS_STORAGE_KEY);
    else window.localStorage.setItem(HAPTICS_STORAGE_KEY, value);
  } catch {
    // Storage unavailable: the choice holds for this page only.
  }
};

let pageStore: HapticsStore | null = null;

/** The page-wide vibration store, created on first use. */
export const getHapticsStore = (): HapticsStore => {
  pageStore ??= createHapticsStore({ read: readStorage, write: writeStorage });
  return pageStore;
};
