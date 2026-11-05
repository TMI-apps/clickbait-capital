import { GAME_STORAGE_PREFIX } from "@/features/game-settings/services/gameStorage";
import {
  MOTION_PREFERENCES,
  type MotionPreference,
  type MotionStore,
} from "@/features/game-settings/types/motionPreference.types";
import { THEME_SHARED_TOKENS } from "@/shared/theme/themeTokens";

export const MOTION_STORAGE_KEY = `${GAME_STORAGE_PREFIX}motion`;
export const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Same value the reduced-motion tokens use (`reduced-motion.tokens.json`). */
const REDUCED_DURATION = "0.01ms";
const DURATION_TOKENS = THEME_SHARED_TOKENS.filter((token) => token.startsWith("duration-"));

export const isMotionPreference = (value: unknown): value is MotionPreference =>
  typeof value === "string" && (MOTION_PREFERENCES as readonly string[]).includes(value);

/** "system" follows the OS; the other two override it. */
export const resolveReducedMotion = (
  preference: MotionPreference,
  systemReduces: boolean
): boolean => (preference === "system" ? systemReduces : preference === "reduced");

export interface MotionStoreDeps {
  read: () => string | null;
  write: (value: string | null) => void;
  systemReduces: () => boolean;
  /** Calls back when the OS setting changes; returns the unsubscribe. */
  watchSystem: (onChange: () => void) => () => void;
  /** Mirrors the resolved state onto the page (CSS). */
  apply: (reduced: boolean, preference: MotionPreference) => void;
}

/**
 * Motion state shared by the whole page, so the settings screen and every animation
 * (game-juice) read one value. Mirrors the game-audio mute store.
 */
export const createMotionStore = (deps: MotionStoreDeps): MotionStore => {
  const stored = deps.read();
  let preference: MotionPreference = isMotionPreference(stored) ? stored : "system";
  let systemReduces = deps.systemReduces();
  let reduced = resolveReducedMotion(preference, systemReduces);
  const listeners = new Set<() => void>();

  const update = (): void => {
    reduced = resolveReducedMotion(preference, systemReduces);
    deps.apply(reduced, preference);
    listeners.forEach((listener) => listener());
  };

  deps.apply(reduced, preference);
  deps.watchSystem(() => {
    systemReduces = deps.systemReduces();
    update();
  });

  return {
    getPreference: () => preference,
    getReducedMotion: () => reduced,
    setPreference: (next) => {
      preference = next;
      deps.write(next);
      update();
    },
    reset: () => {
      preference = "system";
      deps.write(null);
      update();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const readStorage = (): string | null => {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (value: string | null): void => {
  try {
    if (value === null) window.localStorage.removeItem(MOTION_STORAGE_KEY);
    else window.localStorage.setItem(MOTION_STORAGE_KEY, value);
  } catch {
    // Storage unavailable: the choice holds for this page only.
  }
};

const systemQuery = (): MediaQueryList | null =>
  typeof window.matchMedia === "function" ? window.matchMedia(PREFERS_REDUCED_MOTION_QUERY) : null;

/**
 * `data-motion` on `<html>` for CSS hooks, and the duration tokens shortened inline when the
 * player chose "Verminderd" (the token CSS itself only follows the OS media query).
 */
export const applyMotionToDocument = (reduced: boolean, preference: MotionPreference): void => {
  const root = document.documentElement;
  root.dataset.motion = reduced ? "reduced" : "full";
  DURATION_TOKENS.forEach((token) => {
    if (reduced && preference !== "system") root.style.setProperty(`--${token}`, REDUCED_DURATION);
    else root.style.removeProperty(`--${token}`);
  });
};

let pageStore: MotionStore | null = null;

/** The page-wide motion store, created on first use. */
export const getMotionStore = (): MotionStore => {
  pageStore ??= createMotionStore({
    read: readStorage,
    write: writeStorage,
    systemReduces: () => systemQuery()?.matches ?? false,
    watchSystem: (onChange) => {
      const query = systemQuery();
      query?.addEventListener("change", onChange);
      return () => query?.removeEventListener("change", onChange);
    },
    apply: applyMotionToDocument,
  });
  return pageStore;
};
