// Second copy: replaced by the juice recipes (`gameJuiceRecipes.ts`); juice-core lap 2 deletes this.
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "@/features/game-settings/api";
import { useShake } from "@/features/game-juice/hooks/useShake";
import {
  PARTICLE_GLYPHS,
  planJuice,
  WIN_PARTICLE_COUNT,
} from "@/features/game-juice/services/juicePlan";
import { particlePaths, type ParticlePath } from "@/features/juice-effects/api";
import type {
  JuiceAction,
  JuiceMeter,
  JuiceMeterInput,
  JuiceMeterDelta,
  JuicePlan,
  ParticleKind,
  ScreenPoint,
} from "@/features/game-juice/types/juice.types";

/** Attribute that marks a meter as a particle landing spot: `data-juice-meter="revenue"`. */
export const JUICE_METER_ATTR = "data-juice-meter";

/** One burst of particles to render; `key` restarts the animation. */
export interface ParticleBurst {
  key: number;
  kind: ParticleKind;
  origin: ScreenPoint;
  paths: ParticlePath[];
}

function centerOf(element: Element | null): ScreenPoint | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function viewportSize(): ScreenPoint {
  return { x: window.innerWidth, y: window.innerHeight };
}

function meterCenter(meter: JuiceMeter | null): ScreenPoint | null {
  return meter ? centerOf(document.querySelector(`[${JUICE_METER_ATTR}="${meter}"]`)) : null;
}

export interface UseParticleBurstOptions {
  kind: ParticleKind;
  count: number;
  /** Changes once per burst; 0 fires nothing. */
  key: number;
  /** Read when the burst fires; null starts from the lower middle of the screen. */
  getOrigin: () => ScreenPoint | null;
  target: JuiceMeter | null;
}

/**
 * Measures origin and landing spot after the action renders and returns the particle paths,
 * or null when there is nothing to throw or motion is reduced (game-juice D3).
 */
export function useParticleBurst({
  kind,
  count,
  key,
  getOrigin,
  target,
}: UseParticleBurstOptions): ParticleBurst | null {
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState<ParticleBurst | null>(null);

  useLayoutEffect(() => {
    if (key === 0 || reduced || count === 0) {
      setBurst(null);
      return;
    }
    const viewport = viewportSize();
    const start = getOrigin() ?? { x: viewport.x / 2, y: viewport.y * 0.6 };
    const paths = particlePaths({
      glyphs: PARTICLE_GLYPHS[kind],
      count,
      origin: start,
      target: meterCenter(target),
      viewport,
    });
    setBurst({ key, kind, origin: start, paths });
  }, [key, reduced, kind, count, target, getOrigin]);

  return burst;
}

export interface UseActionJuiceOptions<M extends JuiceMeterInput = JuiceMeterInput> {
  /** What the last action was, or null before the first action. */
  action: JuiceAction | null;
  meters: M[];
  /** Changes once per action (the board passes the feed length). */
  key: number;
  /**
   * Keep showing the action before this one (its meters, key and juice) while true, e.g. while
   * the dialog that caused the action closes; the action plays once it turns false.
   */
  hold?: boolean;
}

interface ShownAction<M> {
  action: JuiceAction | null;
  meters: M[];
  key: number;
}

/**
 * The last action that was not held. Second copy of game-board's `useRetainedValue` pattern
 * (`src/features/game-board/hooks/useRetainedValue.ts`); extract to `src/shared/hooks/` at a third.
 */
function useShownAction<M>(current: ShownAction<M>, hold: boolean): ShownAction<M> {
  const [shown, setShown] = useState(current);
  if (!hold && current.key !== shown.key) setShown(current);
  return hold ? shown : current;
}

export interface ActionJuice<M extends JuiceMeterInput = JuiceMeterInput> {
  /** The meters as they should show: held with the juice while `hold` is true. */
  meters: M[];
  /** The plan of the last action since mount (accents and flashes), or null. */
  plan: JuicePlan | null;
  burst: ParticleBurst | null;
  /** Restarts meter flashes and accents per action (held with the juice). */
  key: number;
  /** Ref for the element that shakes on a viral play. */
  shakeRef: RefObject<HTMLDivElement | null>;
  /** Call with the played card's element before playing, so particles start there. */
  markOrigin: (element: Element | null) => void;
}

const NO_PARTICLES: JuicePlan["particles"] = { kind: "emoji", count: 0, target: null };

/**
 * The board's per-action feedback (design § 5): plans it from the last action, shakes the
 * board, measures particle paths and exposes accents and flashes. Nothing fires for the state
 * present at mount (e.g. returning from a phase intro). Reduced motion drops shake and
 * particles; flashes run at the near-zero reduced durations (invisible), while accents, delta
 * chips and MAX marks still show the state change.
 */
export function useActionJuice<M extends JuiceMeterInput>({
  hold = false,
  ...current
}: UseActionJuiceOptions<M>): ActionJuice<M> {
  const { action, meters, key } = useShownAction(current, hold);
  const reduced = useReducedMotion();
  const [mountKey] = useState(key);
  const origin = useRef<ScreenPoint | null>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const fresh = action !== null && key !== mountKey;
  const plan = fresh ? planJuice(action, meters) : null;

  const getOrigin = useCallback(() => origin.current, []);
  useShake(shakeRef, key, plan !== null && plan.shake && !reduced);
  const particles = plan?.particles ?? NO_PARTICLES;
  const burst = useParticleBurst({
    ...particles,
    key: plan ? key : 0,
    getOrigin,
  });
  const markOrigin = useCallback((element: Element | null) => {
    origin.current = centerOf(element);
  }, []);

  return { meters, plan, burst, key, shakeRef, markOrigin };
}

const endOrigin = (): ScreenPoint => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.45 });

/** Confetti for a won run, fired once on mount; none for a loss or under reduced motion. */
export function useEndBurst(outcome: "won" | "lost"): ParticleBurst | null {
  return useParticleBurst({
    kind: "confetti",
    count: outcome === "won" ? WIN_PARTICLE_COUNT : 0,
    key: 1,
    getOrigin: endOrigin,
    target: null,
  });
}

/**
 * The plan for revealing meter changes outside the board, e.g. an event's outcome
 * (event-juice-drop D2): the same flashes, accents and count-up rule a board action earns.
 */
export function useRevealPlan(action: JuiceAction, changes: JuiceMeterDelta[]): JuicePlan {
  return useMemo(
    () =>
      planJuice(
        action,
        changes.map(({ meter, delta }) => ({ key: meter, value: 0, delta }))
      ),
    [action, changes]
  );
}
