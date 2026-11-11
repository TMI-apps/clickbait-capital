/**
 * Content schema for Clickbait Capital: the data a content lap fills (cards, events,
 * phases, balance). The engine reads only these shapes, so balance tuning never needs
 * code changes. Rules SSOT: documentation/DOC_GAME_DESIGN.md.
 */

/**
 * The three effect keys an authored card or event moves (in points). `users` and `revenue` land
 * on the absolute score (Gebruikers, Geld), `reputation` on the hidden 0–100 value (score-redesign D11).
 */
export type MeterKey = "revenue" | "users" | "reputation";

/** The two score numbers on the board: absolute Gebruikers and Geld (euros). */
export type ScoreKey = "users" | "money";

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
 * enters the phase, carried to a later phase if pacing held it back) and fires once. `scandal`
 * events are drawn by the per-turn scandal chance while reputation is below the threshold
 * (score-redesign D13, D22), optionally only in some phases; they may repeat once all of the
 * phase's scandals have fired. Pacing decides on which turn an event opens (game-engine D10).
 */
export type EventTrigger =
  | { kind: "milestone"; phase: PhaseId }
  | { kind: "scandal"; phases?: PhaseId[] };

/** An event card that interrupts the draft until the player picks an option. */
export interface EventDefinition {
  id: string;
  title: string;
  body: string;
  trigger: EventTrigger;
  /** Exactly three policy options. */
  options: [EventOption, EventOption, EventOption];
}

/**
 * A phase goal: two goal lines (score-redesign D17). The phase ends on the turn both numbers
 * reach their line; there is no streak and no reputation condition.
 */
export interface PhaseGoal {
  /** Dutch goal text for the board. */
  description: string;
  users: number;
  /** Euros. */
  money: number;
}

/** One of the four phases: goal, costs and how hard reputation loss hits. */
export interface PhaseDefinition {
  id: PhaseId;
  /** Dutch phase name. */
  name: string;
  goal: PhaseGoal;
  /** Applied after every card turn (server and staff costs). */
  passiveCosts: Effects;
  /** Gebruikers one authored users point of gain adds in this phase (score-redesign D11). */
  usersPerPoint: number;
  /** Euros per authored revenue point in this phase (gains and passive costs alike). */
  moneyPerPoint: number;
  /**
   * Users at which ads and commercial options pay their full amount (score-redesign D20): money
   * gains scale with users / audienceUsers, between 0 and 1.5.
   */
  audienceUsers: number;
  /** Multiplies negative reputation effects of cards, events and decay (reputation loss scales per phase). */
  reputationLossMultiplier: number;
  /** Multiplies positive revenue effects of cards and events (ads pay little in phase 1). */
  revenueGainMultiplier: number;
}

/** Tunable rule constants. Defaults follow the design doc; a content lap may retune them. */
export interface BalanceConfig {
  startUsers: number;
  /** Euros at the start (the investor's money); below 0 is Bankroet (score-redesign D16). */
  startMoney: number;
  /** Hidden reputation at the start (0–100). */
  startReputation: number;
  /**
   * Share of the current users one point of users loss removes (score-redesign D26): losses are
   * relative, so a news card right after a phase change never wipes the users out; gains stay
   * per phase (usersPerPoint), so growth does not compound.
   */
  userLossPerPoint: number;
  /** Toxicity added when any non-news card is played ("nieuws negeren"). */
  newsIgnoredToxicity: number;
  /**
   * Hidden Toxicity above `from` drains reputation every card turn: `perPoint` per point over it
   * (score-redesign D21), so a little toxicity is harmless and a toxic feed eats trust.
   */
  toxicityDrain: { from: number; perPoint: number };
  reputationDecay: { afterTurnsWithoutNews: number; amount: number };
  adFatigue: {
    window: number;
    adsInWindow: number;
    revenueMultiplier: number;
    userLossMultiplier: number;
  };
  echoChamber: { streak: number; userGainMultiplier: number; toxicity: number };
  scandal: ScandalConfig;
  eventPacing: EventPacingConfig;
}

/**
 * Scandal risk (score-redesign D13): 0 at or above `threshold`, rising linearly to `maxChance`
 * over `rampPoints` reputation points below it.
 */
export interface ScandalConfig {
  threshold: number;
  rampPoints: number;
  /** Highest chance per card turn, 0–1. At this chance a scandal counts as urgent for pacing. */
  maxChance: number;
  /**
   * Revenue points every scandal costs on top of the chosen option (a fine, angry advertisers),
   * at the phase's `moneyPerPoint`, so scandals push toward Bankroet, the only game over
   * (score-redesign D25).
   */
  finePoints: number;
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
  /** Fewest card turns before an urgent event: a milestone, or a scandal at the maximum chance. At least 1. */
  urgentMinTurnsBetween: number;
}

/** Everything one game needs. */
export interface GameContent {
  cards: CardDefinition[];
  events: EventDefinition[];
  /** Exactly four phases, ordered 1–4. */
  phases: PhaseDefinition[];
  balance: BalanceConfig;
}
