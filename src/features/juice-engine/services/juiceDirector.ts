import { JUICE_LIMITS, clampJuice } from "@/features/juice-engine/services/juiceEffect";
import { findJuiceAnchor, getJuiceStage } from "@/features/juice-engine/services/juiceAnchors";
import type {
  JuiceCancel,
  JuiceEffect,
  JuiceEffectContext,
  JuiceEffectRegistry,
  JuiceGates,
  JuicePayload,
  JuiceRecipe,
  JuiceRecipeBook,
  JuiceRect,
  JuiceResolvedTarget,
  JuiceStepData,
  JuiceTuning,
} from "@/features/juice-engine/types/juiceEngine.types";

/** How long a run counts toward the concurrency cap after its last step started, ms. */
const RUN_TAIL_MS = 3000;
const FLASH_WINDOW_MS = 1000;
/** Tracked animations above which finished ones are pruned on the next track. */
const TRACKER_PRUNE_AT = 64;

export interface JuiceDirectorOptions {
  effects: JuiceEffectRegistry;
  getBook: () => JuiceRecipeBook;
  getTuning: () => JuiceTuning;
  getGates: () => JuiceGates;
  /** Runs `task` after `ms`; returns its cancel. Default `setTimeout`. */
  schedule?: (task: () => void, ms: number) => JuiceCancel;
  now?: () => number;
  random?: () => number;
  /** Steps that come due while this is true are dropped (background tab). */
  isHidden?: () => boolean;
  findAnchor?: (name: string) => Element | null;
  getStage?: () => HTMLElement | null;
  viewport?: () => JuiceRect;
}

export interface JuiceDirector {
  /** Plays the recipe of one event (the bus listener). */
  play: (name: string, payload: JuicePayload) => void;
  /** Cancels every running run of recipes with this tag. */
  stop: (tag: string) => void;
  /** Cancels everything (unmount, route change). */
  cancelAll: () => void;
}

interface Run {
  name: string;
  tag?: string;
  cancels: Set<JuiceCancel>;
}

interface StepPlan {
  step: JuiceStepData;
  effect: JuiceEffect;
  reduced: boolean;
  delay: number;
}

const defaultSchedule = (task: () => void, ms: number): JuiceCancel => {
  const timer = setTimeout(task, ms);
  return () => clearTimeout(timer);
};

const defaultViewport = (): JuiceRect => ({
  x: 0,
  y: 0,
  width: typeof window === "undefined" ? 0 : window.innerWidth,
  height: typeof window === "undefined" ? 0 : window.innerHeight,
});

const defaultIsHidden = (): boolean =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

const isPoint = (origin: JuicePayload["origin"]): origin is { x: number; y: number } =>
  typeof origin === "object" && origin !== null && !("getBoundingClientRect" in origin);

function rectOf(element: Element): JuiceRect {
  const box = element.getBoundingClientRect();
  return { x: box.left, y: box.top, width: box.width, height: box.height };
}

/** Fills `{name}` placeholders from the payload vars; unknown names become empty. */
export function fillJuiceTemplate(template: string, vars: JuicePayload["vars"] = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? "" : String(vars[key])
  );
}

interface ResolverOptions {
  payload: JuicePayload;
  findAnchor: (name: string) => Element | null;
  viewport: () => JuiceRect;
}

function originTarget(origin: JuicePayload["origin"]): JuiceResolvedTarget | null {
  if (!origin) return null;
  if (isPoint(origin))
    return { element: null, rect: { ...origin, width: 0, height: 0 }, isScreen: false };
  return origin.isConnected ? { element: origin, rect: rectOf(origin), isScreen: false } : null;
}

/** Turns a step's target string into an element and box (or null when it is not on screen). */
function createResolver({ payload, findAnchor, viewport }: ResolverOptions) {
  return (ref: string): JuiceResolvedTarget | null => {
    const name = fillJuiceTemplate(ref, payload.vars);
    if (name === "screen") return { element: null, rect: viewport(), isScreen: true };
    if (name === "origin") return originTarget(payload.origin);
    const element = findAnchor(name);
    return element ? { element, rect: rectOf(element), isScreen: false } : null;
  };
}

/** Shared steps first, then the payload's variant. */
export function juiceRecipeSteps(recipe: JuiceRecipe, variant?: string): JuiceStepData[] {
  const shared = recipe.steps ?? [];
  const extra = variant ? (recipe.variants?.[variant] ?? []) : [];
  return [...shared, ...extra];
}

/** A step with `chance` < 1 plays only when the roll is under it. */
const passesChance = (step: JuiceStepData, random: () => number): boolean =>
  typeof step.chance !== "number" || step.chance >= 1 || random() < step.chance;

/** Rolling-window counter for screen-wide flashes (WCAG 2.3.1). */
function createFlashGuard(now: () => number): () => boolean {
  const times: number[] = [];
  return () => {
    const time = now();
    while (times.length > 0 && time - times[0] >= FLASH_WINDOW_MS) times.shift();
    if (times.length >= JUICE_LIMITS.screenFlashesPerSecond) return false;
    times.push(time);
    return true;
  };
}

/** The animations the juice started, pruned of finished ones when read. */
function createAnimationTracker() {
  const tracked = new Set<Animation>();
  const running = (): Animation[] => {
    tracked.forEach((animation) => {
      if (animation.playState === "finished" || animation.playState === "idle")
        tracked.delete(animation);
    });
    return [...tracked];
  };
  return {
    track: (animation: Animation): void => {
      // Prune as we go, so a long session never piles up finished animations and their nodes.
      if (tracked.size >= TRACKER_PRUNE_AT) running();
      tracked.add(animation);
    },
    running,
    cancelAll: (): void => {
      running().forEach((animation) => animation.cancel());
      tracked.clear();
    },
  };
}

/** The step with its `{var}` target filled, so the flash guard sees where it really plays. */
function filledTarget(step: JuiceStepData, payload: JuicePayload): JuiceStepData {
  return typeof step.target === "string"
    ? { ...step, target: fillJuiceTemplate(step.target, payload.vars) }
    : step;
}

interface PlanInput {
  steps: JuiceStepData[];
  effects: JuiceEffectRegistry;
  tuning: JuiceTuning;
  gates: JuiceGates;
  random: () => number;
}

/** The steps that play right now, with their effect, form and delay (× motion scale). */
function planJuiceSteps({ steps, effects, tuning, gates, random }: PlanInput): StepPlan[] {
  return steps.flatMap((step) => {
    const effect = effects[step.effect];
    if (!effect) {
      if (import.meta.env.DEV) console.warn(`[juice] unknown effect "${step.effect}"`);
      return [];
    }
    const gate = gateJuiceStep({ step, effect, tuning, gates, random });
    if (!gate) return [];
    const delay = Math.max(0, (step.at ?? 0) * tuning.motionScale);
    return [{ step, effect, reduced: gate.reduced, delay }];
  });
}

interface GateInput {
  step: JuiceStepData;
  effect: JuiceEffect;
  tuning: JuiceTuning;
  gates: JuiceGates;
  random: () => number;
}

/** Whether a step plays and in which form; null drops it. */
export function gateJuiceStep({ step, effect, tuning, gates, random }: GateInput): {
  reduced: boolean;
} | null {
  if (!passesChance(step, random)) return null;
  if (effect.channel === "haptic") {
    // Vibration needs the tuning knob and the player's setting, and stays off under reduced motion (A7).
    return tuning.haptics && gates.haptics && !gates.reducedMotion ? { reduced: false } : null;
  }
  if (!gates.reducedMotion || effect.reducedMotion === "keep") return { reduced: false };
  return effect.reducedMotion === "static" ? { reduced: true } : null;
}

/**
 * Plays recipes (juice-core D1, A6): picks the variant, schedules each step after its `at`
 * (× motion scale), gates it by channel and reduced motion, scales it by intensity × strength,
 * keeps screen flashes at most three per second, caps concurrent runs, and cancels on demand.
 * Missing events, effects or targets are skipped, never thrown.
 */
export function createJuiceDirector(options: JuiceDirectorOptions): JuiceDirector {
  const {
    effects,
    getBook,
    getTuning,
    getGates,
    schedule = defaultSchedule,
    now = () => Date.now(),
    random = Math.random,
    isHidden = defaultIsHidden,
    findAnchor = findJuiceAnchor,
    getStage = getJuiceStage,
    viewport = defaultViewport,
  } = options;
  const runs: Run[] = [];
  const retireTimers = new Set<JuiceCancel>();
  const lastStart = new Map<string, number>();
  const takeFlash = createFlashGuard(now);
  const tracker = createAnimationTracker();

  const retire = (run: Run): void => {
    const index = runs.indexOf(run);
    if (index >= 0) runs.splice(index, 1);
  };

  const cancelRun = (run: Run): void => {
    run.cancels.forEach((cancel) => cancel());
    run.cancels.clear();
    retire(run);
  };

  const contextFor = (payload: JuicePayload, reduced: boolean): JuiceEffectContext => {
    const tuning = getTuning();
    const strength = clampJuice(payload.strength ?? 1, 0, 2);
    return {
      resolve: createResolver({ payload, findAnchor, viewport }),
      stage: getStage(),
      intensity: clampJuice(tuning.intensity * strength, 0, JUICE_LIMITS.maxIntensity),
      motionScale: tuning.motionScale,
      volume: tuning.volume,
      reduced,
      random,
      fill: (template) => fillJuiceTemplate(template, payload.vars),
      claimScreenFlash: takeFlash,
      track: tracker.track,
      animations: tracker.running,
    };
  };

  const fire = (run: Run, plan: StepPlan, payload: JuicePayload): void => {
    if (isHidden()) return;
    if (plan.effect.flashes(filledTarget(plan.step, payload)) && !takeFlash()) return;
    const cancel = plan.effect.run(plan.step, contextFor(payload, plan.reduced));
    if (cancel) run.cancels.add(cancel);
  };

  const planSteps = (steps: JuiceStepData[]): StepPlan[] =>
    planJuiceSteps({ steps, effects, tuning: getTuning(), gates: getGates(), random });

  /** Starts a run; false when every step was gated out (nothing plays, no cooldown). */
  const start = (name: string, recipe: JuiceRecipe, payload: JuicePayload): boolean => {
    const plans = planSteps(juiceRecipeSteps(recipe, payload.variant));
    if (plans.length === 0) return false;
    const run: Run = { name, tag: recipe.tag, cancels: new Set() };
    runs.push(run);
    while (runs.length > JUICE_LIMITS.concurrentRuns) cancelRun(runs[0]);
    let last = 0;
    for (const plan of plans) {
      last = Math.max(last, plan.delay);
      if (plan.delay === 0) fire(run, plan, payload);
      else run.cancels.add(schedule(() => fire(run, plan, payload), plan.delay));
    }
    const stopRetire = schedule(() => {
      retireTimers.delete(stopRetire);
      retire(run);
    }, last + RUN_TAIL_MS);
    retireTimers.add(stopRetire);
    return true;
  };

  const play = (name: string, payload: JuicePayload): void => {
    const recipe = getBook()[name];
    if (!recipe) return;
    const time = now();
    const previous = lastStart.get(name);
    if (recipe.cooldownMs && previous !== undefined && time - previous < recipe.cooldownMs) return;
    if (start(name, recipe, payload)) lastStart.set(name, time);
  };

  return {
    play,
    stop: (tag) => [...runs].filter((run) => run.tag === tag).forEach(cancelRun),
    cancelAll: () => {
      [...runs].forEach(cancelRun);
      tracker.cancelAll();
      retireTimers.forEach((stopTimer) => stopTimer());
      retireTimers.clear();
    },
  };
}
