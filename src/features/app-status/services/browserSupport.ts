/** Minimal slice of `globalThis` the check reads; tests pass a fake. */
export interface BrowserEnv {
  matchMedia?: unknown;
  localStorage?: unknown;
  CSS?: { supports?: (property: string, value: string) => boolean };
}

/**
 * True when the browser has the platform features the game relies on beyond what the
 * bundle's syntax already requires: ES2020 built-ins (`Promise.allSettled`, `globalThis`),
 * `matchMedia` (colour mode, motion), storage, and CSS grid. Browsers too old to parse the
 * bundle never reach this check.
 */
export const isBrowserSupported = (env: BrowserEnv = globalThis as BrowserEnv): boolean => {
  try {
    return (
      typeof Promise.allSettled === "function" &&
      typeof globalThis === "object" &&
      typeof env.matchMedia === "function" &&
      "localStorage" in env &&
      env.CSS?.supports?.("display", "grid") === true
    );
  } catch {
    return false;
  }
};
