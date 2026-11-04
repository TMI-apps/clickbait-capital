/*
 * Game vocabulary the flow screens render. Types files may not import the engine or content
 * barrels (they carry runtime code), so these mirror `@/features/game-engine/api`; the board
 * assigns engine values to them, so a drift fails type-check there.
 */
type MeterKey = "revenue" | "users" | "reputation";
type CardType = "viral" | "ad" | "news";
type PhaseId = 1 | 2 | 3 | 4;
type EventOptionKind = "commercial" | "engagement" | "journalism";
type GameOverReason = "bankrupt" | "abandoned" | "banned";

/** One meter change as the kit's `GameCardEffects` shows it. */
export interface FlowEffect {
  meter: MeterKey;
  delta: number;
}

/** A pending event with its three policy options and their phase-scaled effects. */
export interface FlowEvent {
  id: string;
  title: string;
  body: string;
  options: Array<{ id: string; kind: EventOptionKind; label: string; effects: FlowEffect[] }>;
}

/** The phase a transition screen introduces. */
export interface FlowPhase {
  phaseId: PhaseId;
  phaseCount: number;
  goalDescription: string;
}

/** How a run ended, with the engine numbers the ending and results screens read. */
export interface RunSummary {
  outcome: "won" | "lost";
  /** Set when `outcome` is "lost". */
  reason: GameOverReason | null;
  turn: number;
  phaseId: PhaseId;
  phaseName: string;
  /** Raw absolute stats (input for the end report). */
  stats: { users: number; revenue: number };
  /** The same stats formatted for display ("12.500.000", "€ 2.400.000"). */
  statTexts: { users: string; revenue: string };
  playedTypes: readonly CardType[];
  firedEventIds: readonly string[];
}

/** The dramatic ending screen (game over or IPO). */
export interface EndingView {
  outcome: "won" | "lost";
  reason: GameOverReason | null;
  kicker: string;
  title: string;
  headline: string;
  /** Story paragraph; empty for the win. */
  body: string;
  /** Takeaway line; empty for the win (the report carries it). */
  lesson: string;
}

/** One label/value row on the results screen. */
export interface ResultRow {
  id: string;
  label: string;
  value: string;
}

/** The sober results screen. */
export interface ResultsView {
  title: string;
  /** Report intro on a win; empty on a game over. */
  intro: string;
  stats: ResultRow[];
  played: ResultRow[];
  report: ResultRow[];
}
