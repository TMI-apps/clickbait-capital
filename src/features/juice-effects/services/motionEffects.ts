import {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  type JuiceCancel,
  type JuiceEffectContext,
} from "@/features/juice-engine/api";
import { animateJuice, scaledMs } from "@/features/juice-effects/services/overlayEffects";
import type {
  EnterStep,
  PopStep,
  PulseStep,
  ShakeStep,
  TimeWarpStep,
  TraceStep,
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

/** The card ease token's curve: a springy overshoot (`--ease-card`). */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * An entrance: the target fades in from an offset and a scale and settles (a post landing in
 * the feed, the end screen). Plays on top of the element's own transform; reduced motion skips
 * it, so the element simply appears.
 */
export const enterEffect = defineJuiceEffect<EnterStep>({
  id: "enter",
  channel: "motion",
  reducedMotion: "skip",
  params: {
    dy: { unit: "px", min: -64, max: 64, step: 1, label: "Verschuiving" },
    scale: { unit: "×", min: 0.5, max: 1, step: 0.01, label: "Startschaal" },
    duration: DURATION,
  },
  run: (step, context) => {
    const dy = clampJuice(step.dy * context.intensity, -64, 64);
    const scale = clampJuice(1 - (1 - step.scale) * context.intensity, 0.5, 1);
    return animateTarget(
      {
        ref: step.target,
        keyframes: [
          { opacity: 0, transform: `translateY(${dy}px) scale(${scale})` },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        options: {
          duration: scaledMs(step.duration, context),
          easing: step.easing === "linear" ? "linear" : SPRING,
          fill: "backwards",
        },
      },
      context
    );
  },
});

/**
 * Slack around the target the clip leaves open, px: a stroke's caps and joins reach past its
 * geometric box (and a non-scaling stroke past its user-space box), so the clip never trims them.
 */
const TRACE_BLEED_PX = 24;

/**
 * The target draws itself in from its left edge (a chart line's newest stretch). It animates
 * `clip-path` rather than transform or opacity: the one non-compositor property in the library,
 * kept to a short animation on a small element (juice-effects D7). Reduced motion skips it, so
 * the target shows at once.
 */
export const traceEffect = defineJuiceEffect<TraceStep>({
  id: "trace",
  channel: "motion",
  reducedMotion: "skip",
  params: { duration: DURATION },
  run: (step, context) => {
    const target = context.resolve(step.target);
    if (!target?.element) return;
    const bleed = `${TRACE_BLEED_PX}px`;
    const animation = animateJuice(
      {
        element: target.element,
        keyframes: [
          { clipPath: `inset(-${bleed} 100% -${bleed} -${bleed})` },
          { clipPath: `inset(-${bleed} -${bleed} -${bleed} -${bleed})` },
        ],
        options: {
          duration: scaledMs(step.duration, context),
          easing: step.easing === "linear" ? "linear" : "ease-out",
          fill: "backwards",
        },
      },
      context
    );
    return animation ? () => animation.cancel() : undefined;
  },
});

function setRate(animation: Animation, rate: number): void {
  if (typeof animation.updatePlaybackRate === "function") animation.updatePlaybackRate(rate);
  else animation.playbackRate = rate;
}

/** Warps running now; animations keep their pre-warp rate until the last warp ends. */
let activeWarps = 0;
const originalRates = new Map<Animation, number>();

function beginWarp(animations: Animation[], rate: number): void {
  activeWarps += 1;
  animations.forEach((animation) => {
    if (!originalRates.has(animation)) originalRates.set(animation, animation.playbackRate);
    setRate(animation, rate);
  });
}

function endWarp(): void {
  activeWarps = Math.max(0, activeWarps - 1);
  if (activeWarps > 0) return;
  originalRates.forEach((rate, animation) => setRate(animation, rate));
  originalRates.clear();
}

/**
 * Hit-stop (rate 0) or slow-mo: slows only the animations the juice itself started, never the
 * app's UI, for at most `JUICE_LIMITS.timeWarpMs`. Overlapping warps share one restore: every
 * animation gets its pre-warp rate back when the last warp ends or is cancelled.
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
    beginWarp(animations, clampJuice(step.rate, 0, 1));
    let ended = false;
    const end = (): void => {
      if (ended) return;
      ended = true;
      endWarp();
    };
    const timer = setTimeout(end, clampJuice(step.duration, 0, JUICE_LIMITS.timeWarpMs));
    return () => {
      clearTimeout(timer);
      end();
    };
  },
});
