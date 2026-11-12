import {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  type JuiceCancel,
  type JuiceEffectContext,
} from "@/features/juice-engine/api";
import { animateJuice, scaledMs } from "@/features/juice-effects/services/overlayEffects";
import type {
  PopStep,
  PulseStep,
  ShakeStep,
  TimeWarpStep,
  ZoomStep,
} from "@/features/juice-effects/types/juiceEffects.types";

/** Largest shake offset, px: text must stay readable (design § 5 "licht"). */
const MAX_SHAKE_PX = 16;
/** Largest scale any transform effect reaches. */
const MAX_SCALE = 1.5;

/** The scale an effect peaks at: its overshoot above 1 grows with intensity. */
function peakScale(scale: number, intensity: number): number {
  return clampJuice(1 + (scale - 1) * intensity, 0.5, MAX_SCALE);
}

/** Animates the target element's transform on top of its own (composite add); cancel undoes it. */
function animateTarget(
  {
    ref,
    keyframes,
    options,
  }: { ref: string; keyframes: Keyframe[]; options: KeyframeAnimationOptions },
  context: JuiceEffectContext
): JuiceCancel | void {
  const target = context.resolve(ref);
  if (!target?.element) return;
  const animation = animateJuice(
    { element: target.element, keyframes, options: { composite: "add", ...options } },
    context
  );
  return animation ? () => animation.cancel() : undefined;
}

const DURATION = { unit: "ms", min: 50, max: 3000, step: 10, label: "Duur" };
const SCALE = { unit: "×", min: 1, max: MAX_SCALE, step: 0.01, label: "Schaal" };

/** A light horizontal shake of the target (the board on a viral play). */
export const shakeEffect = defineJuiceEffect<ShakeStep>({
  id: "shake",
  channel: "motion",
  reducedMotion: "skip",
  params: {
    strength: { unit: "px", min: 0, max: MAX_SHAKE_PX, step: 0.5, label: "Kracht" },
    duration: DURATION,
  },
  run: (step, context) => {
    const amp = clampJuice(step.strength * context.intensity, 0, MAX_SHAKE_PX);
    const frames = [0, -1, 0.8, -0.6, 0.4, 0].map((share, index) => ({
      transform: `translate3d(${(share * amp).toFixed(1)}px, ${index % 2 ? 1 : 0}px, 0)`,
    }));
    return animateTarget(
      {
        ref: step.target,
        keyframes: frames,
        options: { duration: scaledMs(step.duration, context), easing: "ease-out" },
      },
      context
    );
  },
});

/** Squash & stretch: wide-and-flat, then tall-and-thin, then rest (a card or post landing). */
export const popEffect = defineJuiceEffect<PopStep>({
  id: "pop",
  channel: "motion",
  reducedMotion: "skip",
  params: { scale: SCALE, duration: DURATION },
  run: (step, context) => {
    const peak = peakScale(step.scale, context.intensity);
    const over = peak - 1;
    return animateTarget(
      {
        ref: step.target,
        keyframes: [
          { transform: "scale(1, 1)" },
          { transform: `scale(${peak}, ${1 - over * 0.6})`, offset: 0.3 },
          { transform: `scale(${1 - over * 0.4}, ${1 + over * 0.5})`, offset: 0.6 },
          { transform: "scale(1, 1)" },
        ],
        options: { duration: scaledMs(step.duration, context), easing: "ease-out" },
      },
      context
    );
  },
});

/** The target beats a few times (a warning, a reached goal). */
export const pulseEffect = defineJuiceEffect<PulseStep>({
  id: "pulse",
  channel: "motion",
  reducedMotion: "skip",
  params: {
    scale: SCALE,
    times: { unit: "×", min: 1, max: 8, step: 1, label: "Keer" },
    duration: DURATION,
  },
  run: (step, context) =>
    animateTarget(
      {
        ref: step.target,
        keyframes: [
          { transform: "scale(1)" },
          { transform: `scale(${peakScale(step.scale, context.intensity)})` },
          { transform: "scale(1)" },
        ],
        options: {
          duration: scaledMs(step.duration, context),
          iterations: clampJuice(Math.round(step.times), 1, 8),
          easing: "ease-in-out",
        },
      },
      context
    ),
});

/** A camera-ish push-in on the target that holds and eases back (the chart on a forecast). */
export const zoomEffect = defineJuiceEffect<ZoomStep>({
  id: "zoom",
  channel: "motion",
  reducedMotion: "skip",
  params: { scale: SCALE, duration: DURATION },
  run: (step, context) => {
    const peak = `scale(${peakScale(step.scale, context.intensity)})`;
    return animateTarget(
      {
        ref: step.target,
        keyframes: [
          { transform: "scale(1)" },
          { transform: peak, offset: 0.3 },
          { transform: peak, offset: 0.7 },
          { transform: "scale(1)" },
        ],
        options: { duration: scaledMs(step.duration, context), easing: "ease-in-out" },
      },
      context
    );
  },
});

function setRate(animation: Animation, rate: number): void {
  if (typeof animation.updatePlaybackRate === "function") animation.updatePlaybackRate(rate);
  else animation.playbackRate = rate;
}

/**
 * Hit-stop (rate 0) or slow-mo: slows only the animations the juice itself started, never the
 * app's UI, for at most `JUICE_LIMITS.timeWarpMs`, and restores them on time or on cancel.
 */
export const timeWarpEffect = defineJuiceEffect<TimeWarpStep>({
  id: "timeWarp",
  channel: "motion",
  reducedMotion: "skip",
  params: {
    rate: { unit: "×", min: 0, max: 1, step: 0.05, label: "Tempo" },
    duration: { unit: "ms", min: 20, max: JUICE_LIMITS.timeWarpMs, step: 10, label: "Duur" },
  },
  run: (step, context) => {
    const animations = context.animations();
    if (animations.length === 0) return;
    const rate = clampJuice(step.rate, 0, 1);
    const previous = animations.map((animation) => animation.playbackRate);
    animations.forEach((animation) => setRate(animation, rate));
    let restored = false;
    const restore = (): void => {
      if (restored) return;
      restored = true;
      animations.forEach((animation, index) => setRate(animation, previous[index]));
    };
    const timer = setTimeout(restore, clampJuice(step.duration, 0, JUICE_LIMITS.timeWarpMs));
    return () => {
      clearTimeout(timer);
      restore();
    };
  },
});
