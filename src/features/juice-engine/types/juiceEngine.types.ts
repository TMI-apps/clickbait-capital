/*
 * Vocabulary of the juice engine: semantic events, recipes of timed effect steps, tuning and
 * gates. Game-agnostic on purpose — no card, meter or phase words live here; the game's event
 * catalog and recipes are in `src/features/game-juice/`.
 */

/** Stops whatever an effect or a run started; safe to call twice. */
export type JuiceCancel = () => void;

/** A point in viewport pixels. */
export interface JuicePoint {
  x: number;
  y: number;
}

/** A box in viewport pixels (what an effect positions itself against). */
export interface JuiceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * What an effect plays on. `motion` steps are dropped or made static under reduced motion,
 * `sound` follows the game's mute, `haptic` needs the haptics tuning and gate.
 */
export type JuiceChannel = "motion" | "sound" | "haptic";

/**
 * How an effect behaves when motion is reduced: `skip` drops it, `static` shows its end state
 * without movement (a badge, a callout), `keep` plays it (not motion: sound).
 */
export type JuiceReducedMotion = "skip" | "static" | "keep";

/** Fields every recipe step has; each effect adds its own parameters next to them. */
export interface JuiceStepBase {
  /** Effect id from the effect registry, e.g. `"shake"`. */
  effect: string;
  /** Delay after the event, in ms (scaled by the motion scale). Default 0. */
  at?: number;
  /** Probability 0–1 that the step plays, for variation. Default 1. */
  chance?: number;
}

/** A step with its effect-specific parameters, as the director and the editor see it. */
export type JuiceStepData = JuiceStepBase & Record<string, unknown>;

/**
 * The feedback for one event: `steps` always play, `variants[payload.variant]` play after
 * them. Pure data, so it can be tuned live and exported as JSON.
 */
export interface JuiceRecipe<S extends JuiceStepBase = JuiceStepData> {
  steps?: S[];
  variants?: Record<string, S[]>;
  /** The event is ignored while a previous run started less than this many ms ago. */
  cooldownMs?: number;
  /** Runs carry this tag, so `director.stop(tag)` ends a looping or ramped recipe. */
  tag?: string;
}

/** Recipes by event name. */
export type JuiceRecipeBook<S extends JuiceStepBase = JuiceStepData> = Record<
  string,
  JuiceRecipe<S>
>;

/** What an emitter passes with an event. */
export interface JuicePayload {
  /** Picks `recipe.variants[variant]`. */
  variant?: string;
  /** Where the moment happened: an element (measured when the step runs) or a point. */
  origin?: Element | JuicePoint | null;
  /** 0–2 multiplier on the intensity, for size-dependent juice (a big gain hits harder). */
  strength?: number;
  /** Values for `{name}` templates in step targets and texts. */
  vars?: Record<string, string | number>;
}

/** Event name → payload type; a game declares its catalog as one of these. */
export type JuiceEventMap = { [name: string]: JuicePayload };

/** Global knobs, tuned in the inspector. */
export interface JuiceTuning {
  /** 0–2: amplitude, particle count, opacity and vibration length. */
  intensity: number;
  /** 0.25–3: multiplies every duration and delay (2 = half speed). */
  motionScale: number;
  /** 0–1: multiplies every sound's volume. */
  volume: number;
  /** Vibration on or off (the player's setting can still turn it off). */
  haptics: boolean;
}

/** Per-step value overrides on top of the recipes, plus global tuning overrides. */
export interface JuiceOverrides {
  global?: Partial<JuiceTuning>;
  /** Key `"<event>/<branch>/<index>"` (branch is `steps` or a variant name) → param values. */
  steps?: Record<string, Record<string, number | string | boolean>>;
}

/** What the player's settings allow right now. */
export interface JuiceGates {
  reducedMotion: boolean;
  haptics: boolean;
}

/** A step target after resolving: the element (if any) and its box. */
export interface JuiceResolvedTarget {
  element: Element | null;
  rect: JuiceRect;
  isScreen: boolean;
}

/** Everything an effect needs to play one step. */
export interface JuiceEffectContext {
  /** Resolves `"origin"`, `"screen"` or an anchor name (with `{var}` templates); null if absent. */
  resolve: (ref: string) => JuiceResolvedTarget | null;
  /** The stage that holds overlay nodes, or null when it is not mounted. */
  stage: HTMLElement | null;
  /** Tuning intensity × payload strength, before the effect's own clamps. */
  intensity: number;
  motionScale: number;
  volume: number;
  /** True when the step plays in its static form (reduced motion). */
  reduced: boolean;
  /** 0–1 random source (seedable in tests). */
  random: () => number;
  /** Fills `{name}` templates from the payload vars. */
  fill: (template: string) => string;
  /** Registers an animation the juice started (time warp only touches these). */
  track: (animation: Animation) => void;
  /** The juice's own animations that are still running. */
  animations: () => Animation[];
}

/** Range and unit of one numeric effect parameter; the inspector draws its control from it. */
export interface JuiceParamSpec {
  unit: string;
  min: number;
  max: number;
  step: number;
  label: string;
  /** Value the effect uses when a step leaves this param out (optional params). */
  default?: number;
}

/** One effect primitive. */
export interface JuiceEffect {
  id: string;
  channel: JuiceChannel;
  reducedMotion: JuiceReducedMotion;
  /** Numeric parameters with their ranges (text params are edited as text). */
  params: Record<string, JuiceParamSpec>;
  /** True when this step changes the whole screen's brightness (counted by the flash guard). */
  flashes: (step: JuiceStepData) => boolean;
  run: (step: JuiceStepData, context: JuiceEffectContext) => JuiceCancel | void;
}

/** Effects by id. */
export type JuiceEffectRegistry = Record<string, JuiceEffect>;
