import type {
  ParticleKind,
  ParticlePath,
  ScreenPoint,
} from "@/features/game-juice/types/juice.types";

/** Reaction emoji for viral posts (design § 5: 🔥, 😱, 😡). */
const EMOJI = ["🔥", "😱", "😡"];
const COINS = ["🪙", "💰", "💶"];
const CONFETTI = ["🎉", "💸", "🚀", "✨"];

const GLYPHS: Record<ParticleKind, string[]> = { emoji: EMOJI, coin: COINS, confetti: CONFETTI };

/** Deterministic 0–1 noise per index, so paths look random but tests and replays are stable. */
function noise(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** How far free-flying particles travel, as a share of the viewport's smaller side. */
const BURST_REACH = 0.45;

/** A fan that bursts up and out from the origin (viral emoji, confetti). */
function burstPath(index: number, count: number, viewport: ScreenPoint): ScreenPoint {
  const reach = Math.min(viewport.x, viewport.y) * BURST_REACH;
  const spread = Math.PI * 0.9;
  const angle = -Math.PI / 2 - spread / 2 + (spread * (index + 0.5)) / count;
  const distance = reach * (0.6 + 0.4 * noise(index, 1));
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

/** A path to the target with a little jitter, so coins land in a cluster on the meter. */
function targetPath(index: number, origin: ScreenPoint, target: ScreenPoint): ScreenPoint {
  const jitter = 18;
  return {
    x: target.x - origin.x + (noise(index, 2) - 0.5) * jitter,
    y: target.y - origin.y + (noise(index, 3) - 0.5) * jitter,
  };
}

export interface ParticlePathsOptions {
  kind: ParticleKind;
  count: number;
  origin: ScreenPoint;
  /** Where the particles fly to; null bursts them out over the screen. */
  target: ScreenPoint | null;
  viewport: ScreenPoint;
}

/**
 * Paths for one burst of particles, relative to the origin. Delays stagger the launch and
 * durations vary a little so they don't land as one block. Count is used as given; callers
 * cap it (`PARTICLE_COUNTS`).
 */
export function particlePaths({
  kind,
  count,
  origin,
  target,
  viewport,
}: ParticlePathsOptions): ParticlePath[] {
  const glyphs = GLYPHS[kind];
  return Array.from({ length: count }, (_, index) => {
    const end = target
      ? targetPath(index, origin, target)
      : burstPath(index, Math.max(count, 1), viewport);
    return {
      glyph: glyphs[index % glyphs.length],
      dx: Math.round(end.x),
      dy: Math.round(end.y),
      rotate: Math.round((noise(index, 4) - 0.5) * 120),
      delayMs: Math.round(index * 25 + noise(index, 5) * 40),
      durationScale: 0.8 + 0.2 * noise(index, 6),
    };
  });
}
