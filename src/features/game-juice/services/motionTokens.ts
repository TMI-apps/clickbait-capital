/**
 * Parses a CSS duration ("320ms", "0.4s", "0.01ms") as milliseconds. Motion tokens are CSS
 * variables, so JS-driven motion (count-up, shake) reads the same values as CSS animations
 * and drops to near zero under the reduced-motion token context.
 */
export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = /^\s*(-?\d*\.?\d+)\s*(ms|s)\s*$/.exec(value);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}

/** Reads a duration token from the document root; falls back outside a browser. */
export function readDurationToken(name: string, fallbackMs: number): number {
  if (typeof document === "undefined") return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  return parseDurationMs(raw, fallbackMs);
}
