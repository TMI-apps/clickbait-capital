import type {
  JuiceCancel,
  JuiceChannel,
  JuiceEffect,
  JuiceEffectContext,
  JuiceParamSpec,
  JuiceReducedMotion,
  JuiceStepBase,
  JuiceStepData,
} from "@/features/juice-engine/types/juiceEngine.types";

/**
 * Hard ceilings that no tuning, payload strength or inspector override can pass (juice-core
 * D8, A6). Effects clamp to them after scaling; tests import them instead of repeating numbers.
 */
export const JUICE_LIMITS = {
  /** Max opacity of anything that covers the screen (WCAG 2.3.1 general flash threshold margin). */
  screenOpacity: 0.3,
  /** Max screen-wide flashes (flash, tint, glow on `screen`) per rolling second (WCAG 2.3.1). */
  screenFlashesPerSecond: 3,
  /** Max particles alive on the stage at once (60 fps on a mid-range phone). */
  liveParticles: 48,
  /** Longest single vibration pulse, ms. */
  hapticPulseMs: 60,
  /** Recipe runs alive at once; the oldest is cancelled beyond this. */
  concurrentRuns: 6,
  /** Longest hit-stop / slow-mo, ms. */
  timeWarpMs: 300,
  /** Shortest time a text callout stays readable, ms (11-year-old readers). */
  minReadMs: 1500,
  /** Share of the viewport above which an overlay counts as a screen flash. */
  screenAreaShare: 0.25,
  /** Shortest beat of a screen-wide glow, ms (one beat per guard token). */
  screenBeatMs: 400,
  /** Highest intensity after tuning × strength. */
  maxIntensity: 3,
} as const;

/**
 * Clamps `value` into `[min, max]`; non-finite values become `min`.
 * Second copy: game-audio `soundPlayer.ts` has the same `clamp`; extract to `src/shared/utils/` at a third.
 */
export function clampJuice(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Reads a numeric step param with a fallback. */
export function stepNumber(step: JuiceStepData, key: string, fallback: number): number {
  const value = step[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Reads a text step param with a fallback. */
export function stepText(step: JuiceStepData, key: string, fallback: string): string {
  const value = step[key];
  return typeof value === "string" ? value : fallback;
}

export interface JuiceEffectDefinition<S extends JuiceStepBase> {
  id: S["effect"];
  channel: JuiceChannel;
  reducedMotion: JuiceReducedMotion;
  params: Record<string, JuiceParamSpec>;
  /** Default: never flashes the screen. */
  flashes?: (step: S) => boolean;
  run: (step: S, context: JuiceEffectContext) => JuiceCancel | void;
}

/**
 * Declares one effect primitive with its typed step (A11): the definition is the single place
 * that names the effect, its channel, its reduced-motion behaviour and its tunable params.
 * Steps reach `run` as recipe data; the step type documents and checks the recipe side.
 */
export function defineJuiceEffect<S extends JuiceStepBase>(
  definition: JuiceEffectDefinition<S>
): JuiceEffect {
  const { flashes, run, ...rest } = definition;
  return {
    ...rest,
    flashes: (step) => (flashes ? flashes(step as unknown as S) : false),
    run: (step, context) => run(step as unknown as S, context),
  };
}

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
