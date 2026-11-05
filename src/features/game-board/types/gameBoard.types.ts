/*
 * Engine vocabulary the board renders. Types files may not import the engine barrel (it
 * carries runtime code) nor its internals, so these mirror `@/features/game-engine/api`;
 * `services/boardView.ts` assigns engine values to them, so a drift fails type-check there.
 */
type MeterKey = "revenue" | "users" | "reputation";
type CardType = "viral" | "ad" | "news";
type PhaseId = 1 | 2 | 3 | 4;
type EventOptionKind = "commercial" | "engagement" | "journalism";
type GameOverReason = "bankrupt" | "abandoned" | "banned";

/** One meter as the board shows it: value 0–100 and the change since the previous action. */
export interface MeterView {
  key: MeterKey;
  value: number;
  /** Change caused by the last card or event option (incl. passive costs), or 0. */
  delta: number;
  /** At the cap (100): further gains are wasted, so the board shows "MAX". */
  full: boolean;
}

/** Current phase and how far its goal is. */
export interface PhaseProgressView {
  phaseId: PhaseId;
  phaseName: string;
  phaseCount: number;
  goalDescription: string;
  /** 0–1: how close the goal conditions are (lowest condition ratio). */
  progress: number;
  /** Turns-in-a-row requirement, only for goals that need more than one turn. */
  streak: { current: number; required: number } | null;
  /**
   * Progress on the goal's absolute stats ("Bereik: 85.000 / 100.000"). Only stats the goal
   * reads, so the board never shows a stat next to a meter with a different number.
   */
  goalStats: string[];
  /** Absolute stats for the end screen ("Bereik: 85.000", "Omzet: € 25.000"). */
  usersText: string;
  revenueText: string;
  turn: number;
}

/** One meter change of a card, as GameCard shows it. */
export interface CardEffectView {
  meter: MeterKey;
  /** The part that counts: a gain is capped at the meter's room to 100. */
  delta: number;
  /** Gain wasted at the cap (shown as "MAX"); absent when nothing is wasted. */
  overflow?: number;
}

/** One card of the open draft. */
export interface DraftCardView {
  id: string;
  type: CardType;
  title: string;
  body: string;
  /** Satirical one-liner when the content provides one (game-content `flavor`). */
  flavor?: string;
  effects: CardEffectView[];
  /** Journalistieke Droogte: viral cards get the red frame. */
  droughtWarning: boolean;
}

/** One post in the phone feed (newest first in the list). */
export interface FeedEntry {
  key: string;
  type: CardType | "event";
  title: string;
  body: string;
}

/** The pending event and its three policy options. */
export interface EventView {
  id: string;
  title: string;
  body: string;
  /** Options with their phase-scaled meter effects (what the engine will apply). */
  options: Array<{ id: string; kind: EventOptionKind; label: string; effects: CardEffectView[] }>;
}

/**
 * How the run ended, with the numbers the end screens read (game-flow `RunSummary`; the
 * board passes this view to `GameEndFlow`, so a drift fails type-check there).
 */
export interface GameEndView {
  outcome: "won" | "lost";
  reason: GameOverReason | null;
  turn: number;
  phaseId: PhaseId;
  phaseName: string;
  stats: { users: number; revenue: number };
  /** Stats formatted with the board's nl-NL formatters (game-flow D4). */
  statTexts: { users: string; revenue: string };
  playedTypes: CardType[];
  firedEventIds: string[];
}

/** Everything the board renders for one moment of the run. */
export interface BoardView {
  meters: MeterView[];
  phase: PhaseProgressView;
  draft: DraftCardView[];
  feed: FeedEntry[];
  event: EventView | null;
  end: GameEndView | null;
}
