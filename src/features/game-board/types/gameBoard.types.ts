/*
 * Engine vocabulary the board renders. Types files may not import the engine barrel (it
 * carries runtime code) nor its internals, so these mirror `@/features/game-engine/api`;
 * `services/boardView.ts` assigns engine values to them, so a drift fails type-check there.
 */
type MeterKey = "revenue" | "users" | "reputation";
type CardType = "viral" | "ad" | "news";
type PhaseId = 1 | 2 | 3 | 4;
type EventOptionKind = "commercial" | "engagement" | "journalism";
type GameOverReason = "bankrupt";

/**
 * One score number as the board shows it (score-redesign D23, interim until the chart): the
 * absolute amount and its change, and a bar for the progress to the phase's goal line.
 * `revenue` is the Geld tile, `users` the Gebruikers tile (the juice keys stay the meter keys).
 */
export interface MeterView {
  key: Exclude<MeterKey, "reputation">;
  /** 0–100: progress to the phase's goal line. */
  value: number;
  /**
   * The line on the score chart (score-redesign D10): this number as a share of the phase's goal
   * line (1 = on the line) at the start of the phase and after each action in it, oldest first,
   * at most the last 12 points.
   */
  history: number[];
  /** Absolute users or euros. */
  amount: number;
  amountText: string;
  /** Absolute change caused by the last card or event option (incl. passive costs), or 0. */
  delta: number;
  /** "+12.000" / "−€ 5.000"; empty when nothing changed. */
  deltaText: string;
  /** "Doel: 100.000" (spoken; the chart shows the goal as a coloured goal line). */
  goalText: string;
  /** The goal value alone ("100.000", "€ 150.000"): the label on the chart's goal line. */
  goalAmountText: string;
  /** The goal line is reached. */
  full: boolean;
  /** Geld is low enough that Bankroet is near (a few turns of costs): the board warns. */
  danger: boolean;
  /** What a screen reader hears for this tile: amount, last change, goal and warnings. */
  valueText: string;
}

/** Points the score chart shows: the start of the phase and the last actions in it. */
export const SCORE_HISTORY_POINTS = 12;

/** The visible scandal risk (score-redesign D13): only while reputation is below the threshold. */
export interface ScandalRiskView {
  /** Chance per card turn, 0–1. */
  chance: number;
  /** "Schandaal dreigt: 35% kans per beurt". */
  text: string;
}

/** Current phase and how far its goal is. */
export interface PhaseProgressView {
  phaseId: PhaseId;
  phaseName: string;
  phaseCount: number;
  goalDescription: string;
  /** 0–1: how close both goal lines are (the lower of the two). */
  progress: number;
  /** Progress on both goal lines ("Gebruikers: 85.000 / 100.000", "Geld: € 20.000 / € 150.000"). */
  goalStats: string[];
  turn: number;
}

/** One meter change of a card, as GameCard shows it. */
export interface CardEffectView {
  meter: MeterKey;
  /** The absolute change as text ("12.000", "€ 2.000"); `delta` keeps the sign (score-redesign D15). */
  amountText?: string;
  /** Authored points after phase scaling (interim until L2 shows absolute amounts, score-redesign D15). */
  delta: number;
  /** Unused since there is no meter cap (score-redesign D23); the kit still accepts it. */
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
  /**
   * Where each score line lands if this card is played now, as a share of its goal line
   * (score-redesign D12): the chart's forecast point while the card is held, dragged or open.
   */
  forecast: Record<"users" | "revenue", number>;
  /** Journalistieke Droogte: viral cards get the red frame. */
  droughtWarning: boolean;
}

/** One post in the phone feed (newest first in the list). */
export interface FeedEntry {
  key: string;
  /** Index of the session step the post shows: its follower comments are looked up by it (feed-comments D1). */
  step: number;
  /** Card or event id: the feed shows its picture (`getCardImage`, feed-images D1). */
  contentId: string;
  type: CardType | "event";
  title: string;
  body: string;
  /** Event posts: the chosen option's kind, which sets the board juice (event-juice-drop D1). */
  optionKind?: EventOptionKind;
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
  /** Peak users and final money (game-flow `RunSummary`). */
  score: { users: number; money: number };
  /** The same numbers formatted with the board's nl-NL formatters (game-flow D4). */
  statTexts: { users: string; money: string };
  playedTypes: CardType[];
  firedEventIds: string[];
}

/** Everything the board renders for one moment of the run. */
export interface BoardView {
  meters: MeterView[];
  scandal: ScandalRiskView | null;
  phase: PhaseProgressView;
  draft: DraftCardView[];
  feed: FeedEntry[];
  event: EventView | null;
  end: GameEndView | null;
}
