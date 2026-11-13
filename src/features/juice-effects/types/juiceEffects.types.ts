/*
 * Recipe steps of every effect primitive. Durations are ms before the motion scale; colours
 * name a theme token (`"success"` → `var(--success)`), so recipes never hardcode colours and
 * the primitives stay free of game words (A4). Targets are `"origin"`, `"screen"` or an anchor
 * name, with `{var}` templates.
 */

/**
 * Fields every recipe step has. Mirrors juice-engine's `JuiceStepBase` (types files may not
 * import other features); `defineJuiceEffect<S extends JuiceStepBase>` fails type-check on drift.
 */
export interface JuiceStepBase {
  effect: string;
  at?: number;
  chance?: number;
}

/** Plays a sound by id; the game wires it to its audio player. */
export type SoundPort = (id: string, options: { volume: number; rate: number }) => void;

/** Horizontal screen-shake of the target element. */
export interface ShakeStep extends JuiceStepBase {
  effect: "shake";
  target: string;
  /** Largest offset, px (× intensity, at most 16). */
  strength: number;
  duration: number;
}

/** Squash & stretch: the target scales to `scale` and springs back. */
export interface PopStep extends JuiceStepBase {
  effect: "pop";
  target: string;
  /** Peak scale, e.g. 1.15 (the overshoot × intensity, at most 1.5). */
  scale: number;
  duration: number;
}

/** The target beats `times` times. */
export interface PulseStep extends JuiceStepBase {
  effect: "pulse";
  target: string;
  scale: number;
  times: number;
  /** Length of one beat, ms. */
  duration: number;
}

/** Camera-ish push-in on the target and back. */
export interface ZoomStep extends JuiceStepBase {
  effect: "zoom";
  target: string;
  scale: number;
  duration: number;
}

/** An entrance: the target fades in from an offset and scale (a post landing, a screen appearing). */
export interface EnterStep extends JuiceStepBase {
  effect: "enter";
  target: string;
  /** Start offset, px (negative = from above). */
  dy: number;
  /** Start scale (0.9 = from slightly smaller); 1 = no scale. */
  scale: number;
  duration: number;
  /** "spring" overshoots (lively), "linear" is dry (news). Default "spring". */
  easing?: "spring" | "linear";
}

/**
 * The target draws itself in from its left edge (a chart line's newest stretch): a clip that
 * opens left to right. Reduced motion skips it, so the target simply shows.
 */
export interface TraceStep extends JuiceStepBase {
  effect: "trace";
  target: string;
  duration: number;
  /** "ease-out" settles (default), "linear" is dry (news). */
  easing?: "ease-out" | "linear";
}

/** Hit-stop (rate 0) or slow-mo (rate < 1) of the juice's own running animations. */
export interface TimeWarpStep extends JuiceStepBase {
  effect: "timeWarp";
  /** Playback rate 0–1 while it lasts. */
  rate: number;
  /** At most `JUICE_LIMITS.timeWarpMs`. */
  duration: number;
}

/** A colour wash over the target that fades in and out. */
export interface FlashStep extends JuiceStepBase {
  effect: "flash";
  target: string;
  color: string;
  /** Peak opacity (screen: at most `JUICE_LIMITS.screenOpacity`). */
  opacity: number;
  duration: number;
}

/** A glowing ring around the target that beats `times` times. */
export interface GlowStep extends JuiceStepBase {
  effect: "glow";
  target: string;
  color: string;
  times: number;
  duration: number;
}

/** A soft vignette in a colour that holds, then fades (mood, e.g. danger). */
export interface TintStep extends JuiceStepBase {
  effect: "tint";
  target: string;
  color: string;
  opacity: number;
  duration: number;
}

/** A small glyph that pops onto the target's top-right corner. */
export interface BadgeStep extends JuiceStepBase {
  effect: "badge";
  target: string;
  glyph: string;
  duration: number;
}

/** Glyphs that burst out (no `to`) or fly to a target. */
export interface ParticlesStep extends JuiceStepBase {
  effect: "particles";
  /** Where they start (default `"origin"`, else the lower middle of the screen). */
  from?: string;
  /** Where they land; omitted = a burst. */
  to?: string;
  /** Glyph set as one string, e.g. "🔥😱😡". */
  glyphs: string;
  /** × intensity, within the live-particle cap. */
  count: number;
  duration: number;
  /** Burst reach as a share of the viewport's smaller side. */
  reach?: number;
  /** Glyph size, rem. */
  size?: number;
  /** Colour token of a soft explosion behind the burst; omitted = none. */
  glow?: string;
}

/** Text (a number) that rises from the target and fades. */
export interface FloaterStep extends JuiceStepBase {
  effect: "floater";
  target: string;
  /** Template, e.g. "{text}". */
  text: string;
  color: string;
  /** Rise, px. */
  rise: number;
  duration: number;
}

/** A pill of text that pops at the target (or the screen) and stays readable. */
export interface CalloutStep extends JuiceStepBase {
  effect: "callout";
  target: string;
  text: string;
  color: string;
  /** At least `JUICE_LIMITS.minReadMs`. */
  duration: number;
}

/** A sound through the game's player. */
export interface SoundStep extends JuiceStepBase {
  effect: "sound";
  id: string;
  /** 0–1 before the master volume (default 1). */
  volume?: number;
  /** Playback rate (pitch), 0.5–2 (default 1). */
  rate?: number;
  /** Random ± share of the rate per play, for variation (e.g. 0.06). */
  rateJitter?: number;
}

/** A vibration pattern: "pulse pause pulse …" in ms (Android; iOS browsers ignore it). */
export interface HapticStep extends JuiceStepBase {
  effect: "haptic";
  pattern: string;
}

/** Any recipe step the effect library can play. */
export type JuiceEffectStep =
  | ShakeStep
  | PopStep
  | PulseStep
  | ZoomStep
  | EnterStep
  | TraceStep
  | TimeWarpStep
  | FlashStep
  | GlowStep
  | TintStep
  | BadgeStep
  | ParticlesStep
  | FloaterStep
  | CalloutStep
  | SoundStep
  | HapticStep;
