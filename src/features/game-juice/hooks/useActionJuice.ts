import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useMotionPreference } from "@/features/game-juice/hooks/useMotionPreference";
import { useShake } from "@/features/game-juice/hooks/useShake";
import { planJuice, WIN_PARTICLE_COUNT } from "@/features/game-juice/services/juicePlan";
import { particlePaths } from "@/features/game-juice/services/particlePaths";
import type {
  JuiceAction,
  JuiceMeter,
  JuiceMeterInput,
  JuicePlan,
  ParticleKind,
  ParticlePath,
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
  const { reduced } = useMotionPreference();
  const [burst, setBurst] = useState<ParticleBurst | null>(null);

  useLayoutEffect(() => {
    if (key === 0 || reduced || count === 0) {
      setBurst(null);
      return;
    }
    const viewport = viewportSize();
    const start = getOrigin() ?? { x: viewport.x / 2, y: viewport.y * 0.6 };
    const paths = particlePaths({
      kind,
      count,
      origin: start,
      target: meterCenter(target),
      viewport,
    });
    setBurst({ key, kind, origin: start, paths });
  }, [key, reduced, kind, count, target, getOrigin]);

  return burst;
}

export interface UseActionJuiceOptions {
  /** What the last action was, or null before the first action. */
  action: JuiceAction | null;
  meters: JuiceMeterInput[];
  /** Changes once per action (the board passes the feed length). */
  key: number;
}

export interface ActionJuice {
  /** The plan of the last action since mount (accents and flashes), or null. */
  plan: JuicePlan | null;
  burst: ParticleBurst | null;
  /** Restarts meter flashes and accents per action. */
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
 * present at mount (e.g. returning from a phase intro). Reduced motion keeps accents and
 * flashes (the state change) but drops shake and particles.
 */
export function useActionJuice({ action, meters, key }: UseActionJuiceOptions): ActionJuice {
  const { reduced } = useMotionPreference();
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

  return { plan, burst, key, shakeRef, markOrigin };
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
