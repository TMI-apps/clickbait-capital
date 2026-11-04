/*
 * Vocabulary of the game-juice feature. Kept free of other features' imports (types files
 * may not import runtime barrels): the meter and card-type unions mirror the engine's, and
 * the board assigns its view values to them, so a drift fails type-check there.
 */

/** A platform meter: Inkomsten, Gebruikers, Reputatie. */
export type JuiceMeter = "revenue" | "users" | "reputation";

/** What caused the feedback: a card type or an answered event. */
export type JuiceAction = "viral" | "ad" | "news" | "event";

/** Particle look: neon reaction emoji (viral), gold coins (ad), confetti (a won run). */
export type ParticleKind = "emoji" | "coin" | "confetti";

/** Small persistent mark on one meter after an action (design § 5). */
export type MeterAccent = "flames" | "gold" | "shield";

/** Direction a meter moved on the last action. */
export type MeterFlash = "gain" | "loss";

/** One meter as the juice reads it: its value and the change of the last action. */
export interface JuiceMeterInput {
  key: JuiceMeter;
  value: number;
  delta: number;
}

/** Everything one action earns, before motion preference is applied. */
export interface JuicePlan {
  action: JuiceAction;
  /** Light screen shake (viral only). */
  shake: boolean;
  /** Particles to throw; `count` 0 means none. `target` is the meter they fly to, if any. */
  particles: { kind: ParticleKind; count: number; target: JuiceMeter | null };
  /** Accent per meter (only meters that earn one). */
  accents: Partial<Record<JuiceMeter, MeterAccent>>;
  /** Gain / loss flash per meter that moved (none for news: intentionally dull). */
  flashes: Partial<Record<JuiceMeter, MeterFlash>>;
  /** Meter numbers count up / down; false snaps them (news, design § 5 "geen animatie"). */
  countUp: boolean;
}

/** One particle's path, relative to its origin, in px; delays and spin for variety. */
export interface ParticlePath {
  glyph: string;
  dx: number;
  dy: number;
  rotate: number;
  delayMs: number;
  /** Percentage of the full particle duration this particle takes (spread the landing). */
  durationScale: number;
}

/** A point on screen in viewport px. */
export interface ScreenPoint {
  x: number;
  y: number;
}
