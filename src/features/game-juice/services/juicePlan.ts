import type {
  JuiceAction,
  JuiceMeter,
  JuiceMeterInput,
  JuicePlan,
  MeterAccent,
  MeterFlash,
  ParticleKind,
} from "@/features/game-juice/types/juice.types";

/**
 * Particle budget per action (game-juice D4): a mid-range phone keeps 60 fps with a dozen
 * transform/opacity layers. News and events get none — ethics stays dull (design § 5).
 */
export const PARTICLE_COUNTS: Record<JuiceAction, number> = {
  viral: 12,
  ad: 10,
  news: 0,
  event: 0,
};

/** Particles thrown when a run is won (the IPO); a loss gets none. */
export const WIN_PARTICLE_COUNT = 14;

const PARTICLE_KIND: Record<JuiceAction, ParticleKind> = {
  viral: "emoji",
  ad: "coin",
  news: "emoji",
  event: "emoji",
};

/** Coins fly to Inkomsten; viral emoji fly freely over the screen. */
const PARTICLE_TARGET: Record<JuiceAction, JuiceMeter | null> = {
  viral: null,
  ad: "revenue",
  news: null,
  event: null,
};

/** Accent per action and the meter it sits on (game-juice D6). */
const ACTION_ACCENT: Partial<Record<JuiceAction, { meter: JuiceMeter; accent: MeterAccent }>> = {
  viral: { meter: "users", accent: "flames" },
  ad: { meter: "revenue", accent: "gold" },
  news: { meter: "reputation", accent: "shield" },
};

function flashesFor(meters: JuiceMeterInput[]): Partial<Record<JuiceMeter, MeterFlash>> {
  const flashes: Partial<Record<JuiceMeter, MeterFlash>> = {};
  for (const { key, delta } of meters) {
    if (delta !== 0) flashes[key] = delta > 0 ? "gain" : "loss";
  }
  return flashes;
}

/**
 * The feedback one action earns (design § 5 feedback matrix): viral shakes the screen and
 * throws emoji with flames at Gebruikers, an ad throws coins to Inkomsten with a gold glow,
 * news only shows a small shield at Reputatie — no flash, no count-up (game-juice D8). For
 * the other actions every meter that moved flashes gain / loss and counts to its new value.
 * Pure: motion preference is applied by the caller.
 */
export function planJuice(action: JuiceAction, meters: JuiceMeterInput[]): JuicePlan {
  const accent = ACTION_ACCENT[action];
  const dull = action === "news";
  return {
    action,
    shake: action === "viral",
    particles: {
      kind: PARTICLE_KIND[action],
      count: PARTICLE_COUNTS[action],
      target: PARTICLE_TARGET[action],
    },
    accents: accent ? { [accent.meter]: accent.accent } : {},
    flashes: dull ? {} : flashesFor(meters),
    countUp: !dull,
  };
}
