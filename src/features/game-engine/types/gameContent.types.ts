/**
 * Content schema for Clickbait Capital: the data a content lap fills (cards, events,
 * phases, balance). The engine reads only these shapes, so balance tuning never needs
 * code changes. Rules SSOT: documentation/DOC_GAME_DESIGN.md.
 */

/** The three visible meters, each 0–100. */
export type MeterKey = "revenue" | "users" | "reputation";

/** The three regular card types; a draft holds any mix of them (shuffled-hand D1). */
export type CardType = "viral" | "ad" | "news";

/** Phase number: 1 Zolderkamer, 2 Scale-Up, 3 Wereldwijd Platform, 4 Beursgang. */
export type PhaseId = 1 | 2 | 3 | 4;

/** Signed changes a card, event option or passive cost applies. Missing keys mean 0. */
export interface Effects {
  revenue?: number;
  users?: number;
  reputation?: number;
  /** Hidden Toxicity pool (0–100). */
  toxicity?: number;
}

/** Effects with every key present, as the engine computes and reports them. */
export type FullEffects = Required<Effects>;

/** One regular card of the draft. */
export interface CardDefinition {
  id: string;
  type: CardType;
  /** Dutch player-facing title. */
  title: string;
  /** Dutch player-facing body text. */
  body: string;
  effects: Effects;
  /** Phases in which the card can be drafted; omitted means every phase. */
  phases?: PhaseId[];
}

/** Policy direction of an event option (design § 4 Type 2). */
export type EventOptionKind = "commercial" | "engagement" | "journalism";

/** One of the three policy choices of an event. */
export interface EventOption {
  id: string;
  kind: EventOptionKind;
  /** Dutch label shown on the option button. */
  label: string;
  effects: Effects;
}

/**
 * When an event is due. `milestone` is due from the phase on (it opens soon after the game
 * enters the phase, carried to a later phase if pacing held it back); `toxicity` while hidden
 * Toxicity is above the threshold (optionally only in some phases). Each event fires at most
 * once per game; pacing decides on which turn a due event opens (game-engine D10).
 */
export type EventTrigger =
  | { kind: "milestone"; phase: PhaseId }
  | { kind: "toxicity"; threshold: number; phases?: PhaseId[] };

/** An event card that interrupts the draft until the player picks an option. */
export interface EventDefinition {
  id: string;
  title: string;
  body: string;
  trigger: EventTrigger;
  /** Exactly three policy options. */
  options: [EventOption, EventOption, EventOption];
}

/** Absolute stats tracked next to the meters (users = DAU, revenue = gross omzet in EUR). */
export type StatKey = "users" | "revenue";

/** One condition of a phase goal: an absolute stat at least a value, or a meter above one. */
export type GoalCondition =
  | { kind: "stat"; stat: StatKey; atLeast: number }
  | { kind: "meter"; meter: MeterKey; above: number };

/**
 * A phase goal holds when all conditions hold for `consecutiveTurns` turns in a row
 * (1 = reach once). Phase 3 and the IPO use longer streaks.
 */
export interface PhaseGoal {
  /** Dutch goal text for the board. */
  description: string;
  conditions: GoalCondition[];
  consecutiveTurns: number;
}

/** One of the four phases: goal, costs and how hard reputation loss hits. */
export interface PhaseDefinition {
  id: PhaseId;
  /** Dutch phase name. */
  name: string;
  goal: PhaseGoal;
  /** Applied after every card turn (server and staff costs). */
  passiveCosts: Effects;
  /**
   * The users stat at a full Gebruikers meter: the phase's reachable market. The stat is the
   * meter's share of it (game-engine D1), so a new phase means a bigger market behind the meter.
   */
  usersAtFullMeter: number;
  /** Euros of gross revenue per point of positive revenue-meter change from cards and events. */
  revenuePerPoint: number;
  /** Multiplies negative reputation effects of cards, events and decay (reputation loss scales per phase). */
  reputationLossMultiplier: number;
  /** Multiplies positive revenue effects of cards and events (ads pay little in phase 1). */
  revenueGainMultiplier: number;
}

/** Tunable rule constants. Defaults follow the design doc; a content lap may retune them. */
export interface BalanceConfig {
  startMeter: number;
  /** Gross revenue at the start; the users stat follows the start meter (game-engine D1). */
  startRevenue: number;
  /** Toxicity added when any non-news card is played ("nieuws negeren"). */
  newsIgnoredToxicity: number;
  reputationDecay: { afterTurnsWithoutNews: number; amount: number };
  adFatigue: {
    window: number;
    adsInWindow: number;
    revenueMultiplier: number;
    userLossMultiplier: number;
  };
  echoChamber: { streak: number; userGainMultiplier: number; toxicity: number };
  journalismDrought: { afterTurnsWithoutNews: number; viralToxicityMultiplier: number };
  eventPacing: EventPacingConfig;
}

/**
 * How world events are spread over a run (game-engine D10). Gaps count card turns between
 * the turns on which two events open; at most one event opens per card turn.
 */
export interface EventPacingConfig {
  /** Fewest card turns between a previous event and a regular (Toxicity) event. */
  minTurnsBetween: number;
  /** A seeded 0…n extra turns on top of `minTurnsBetween`, drawn after each event. */
  randomExtraTurns: number;
  /** Fewest card turns before an urgent event: a milestone, or any event in a crisis. At least 1. */
  urgentMinTurnsBetween: number;
  /** Toxicity from which due events are urgent: the crisis reacts fast, but not on the same turn. */
  crisisToxicity: number;
}

/** Everything one game needs. */
export interface GameContent {
  cards: CardDefinition[];
  events: EventDefinition[];
  /** Exactly four phases, ordered 1–4. */
  phases: PhaseDefinition[];
  balance: BalanceConfig;
}
