import type { JuicePoint } from "@/features/juice-engine/api";

/** One particle's path relative to its origin, in px, with stagger and spin for variety. */
export interface ParticlePath {
  glyph: string;
  dx: number;
  dy: number;
  rotate: number;
  delayMs: number;
  /** Share of the full particle duration this particle takes (spreads the landing). */
  durationScale: number;
}

/** Deterministic 0–1 noise per index, so paths look random but tests and replays are stable. */
function noise(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Default reach of free-flying particles, as a share of the viewport's smaller side. */
const DEFAULT_REACH = 0.45;
/** Default fan width of a burst, as a share of a half turn (0.9 ≈ 160°, opening upward). */
const DEFAULT_SPREAD = 0.9;

interface BurstShape {
  count: number;
  viewport: JuicePoint;
  reach: number;
  spread: number;
}

/** A fan that bursts up and out from the origin (viral emoji, confetti). */
function burstPath(index: number, { count, viewport, reach, spread }: BurstShape): JuicePoint {
  const distanceMax = Math.min(viewport.x, viewport.y) * reach;
  const fan = Math.PI * spread;
  const angle = -Math.PI / 2 - fan / 2 + (fan * (index + 0.5)) / count;
  const distance = distanceMax * (0.6 + 0.4 * noise(index, 1));
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

/** A path to the target with a little jitter, so coins land in a cluster on the meter. */
function targetPath(index: number, origin: JuicePoint, target: JuicePoint): JuicePoint {
  const jitter = 18;
  return {
    x: target.x - origin.x + (noise(index, 2) - 0.5) * jitter,
    y: target.y - origin.y + (noise(index, 3) - 0.5) * jitter,
  };
}

export interface ParticlePathsOptions {
  /** Glyphs to cycle through (one per particle, in order). */
  glyphs: readonly string[];
  count: number;
  origin: JuicePoint;
  /** Where the particles fly to; null bursts them out over the screen. */
  target: JuicePoint | null;
  viewport: JuicePoint;
  /** Burst reach as a share of the viewport's smaller side (default 0.45). */
  reach?: number;
  /** Burst fan width as a share of a half turn (default 0.9). */
  spread?: number;
}

/**
 * Paths for one burst of particles, relative to the origin. Delays stagger the launch and
 * durations vary a little so they don't land as one block. Count is used as given; callers
 * cap it (`JUICE_LIMITS.liveParticles`).
 */
export function particlePaths({
  glyphs,
  count,
  origin,
  target,
  viewport,
  reach = DEFAULT_REACH,
  spread = DEFAULT_SPREAD,
}: ParticlePathsOptions): ParticlePath[] {
  const shape: BurstShape = { count: Math.max(count, 1), viewport, reach, spread };
  return Array.from({ length: count }, (_, index) => {
    const end = target ? targetPath(index, origin, target) : burstPath(index, shape);
    return {
      glyph: glyphs.length > 0 ? glyphs[index % glyphs.length] : "✨",
      dx: Math.round(end.x),
      dy: Math.round(end.y),
      rotate: Math.round((noise(index, 4) - 0.5) * 120),
      delayMs: Math.round(index * 25 + noise(index, 5) * 40),
      durationScale: 0.8 + 0.2 * noise(index, 6),
    };
  });
}

/**
 * Splits a glyph string ("🔥😱😡") into user-perceived characters, so emoji made of several
 * code points stay whole. Recipes write glyph sets as one string.
 */
export function splitGlyphs(text: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenterClass }).Segmenter;
  const parts = Segmenter
    ? Array.from(
        new Segmenter(undefined, { granularity: "grapheme" }).segment(text),
        (part) => part.segment
      )
    : Array.from(text);
  return parts.filter((glyph) => glyph.trim());
}

/** `Intl.Segmenter` (ES2022) as far as this file uses it; the TS lib target predates it. */
type GraphemeSegmenterClass = new (
  locale: undefined,
  options: { granularity: "grapheme" }
) => { segment: (text: string) => Iterable<{ segment: string }> };
