import {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  type JuiceEffect,
} from "@/features/juice-engine/api";
import type {
  HapticStep,
  SoundPort,
  SoundStep,
} from "@/features/juice-effects/types/juiceEffects.types";

/**
 * Sound through the game's player (the port), so mute, the gesture unlock and the mix stay in
 * game-audio. Volume × the master volume; pitch varies a little per play when `rateJitter` is
 * set, so a sound heard twenty times a run doesn't grate.
 */
export function createSoundEffect(port: SoundPort): JuiceEffect {
  return defineJuiceEffect<SoundStep>({
    id: "sound",
    channel: "sound",
    reducedMotion: "keep",
    params: {
      volume: { unit: "", min: 0, max: 1, step: 0.05, label: "Volume" },
      rate: { unit: "×", min: 0.5, max: 2, step: 0.01, label: "Toonhoogte" },
      rateJitter: { unit: "±", min: 0, max: 0.3, step: 0.01, label: "Variatie" },
    },
    run: (step, context) => {
      const volume = clampJuice((step.volume ?? 1) * context.volume, 0, 1);
      if (volume <= 0) return;
      const jitter = clampJuice(step.rateJitter ?? 0, 0, 0.3) * (context.random() * 2 - 1);
      const rate = clampJuice((step.rate ?? 1) * (1 + jitter), 0.5, 2);
      port(step.id, { volume, rate });
    },
  });
}

/** Parses "pulse pause pulse …" (ms); pulses × intensity, each at most the haptic limit. */
export function hapticPattern(pattern: string, intensity: number): number[] {
  return pattern
    .split(/[\s,]+/)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((ms, index) =>
      index % 2 === 0
        ? Math.round(clampJuice(ms * intensity, 0, JUICE_LIMITS.hapticPulseMs))
        : Math.round(ms)
    );
}

const canVibrate = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/** A short vibration (Android; iOS browsers have no vibration API, so it is silently skipped). */
export const hapticEffect = defineJuiceEffect<HapticStep>({
  id: "haptic",
  channel: "haptic",
  reducedMotion: "keep",
  params: {},
  run: (step, context) => {
    if (!canVibrate()) return;
    const pattern = hapticPattern(step.pattern, context.intensity);
    if (!pattern.some((ms, index) => index % 2 === 0 && ms > 0)) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      return;
    }
    return () => {
      try {
        navigator.vibrate(0);
      } catch {
        // Nothing to stop.
      }
    };
  },
});
