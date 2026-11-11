import type {
  CardType,
  FullEffects,
  PhaseId,
  ScoreKey,
} from "@/features/game-engine/types/gameContent.types";

/** Why a game ended: only Bankroet, Geld below € 0 (score-redesign D16). */
export type GameOverReason = "bankrupt";

/** `event`: a draft is interrupted until `resolveEvent` is called. */
export type GameStatus = "playing" | "event" | "won" | "lost";

/** The draft: different card ids in slot order, any mix of types (shuffled-hand D1). */
export type Hand = readonly string[];

/**
 * The draw piles of the current phase (deck-draw D1, D3): per card type, card ids top first.
 * Every shown card goes to the bottom of its pile, so it returns only after the rest of its
 * type has been shown.
 */
export interface DrawDeck {
  phase: PhaseId;
  piles: Record<CardType, string[]>;
  /** The last hand shown; never shown again in the next hand (D4). */
  lastHand: string[];
}

/** Which correction rules changed the last card (for UI feedback such as red borders). */
export interface TurnModifiers {
  adFatigue: boolean;
  echoChamber: boolean;
  reputationDecay: boolean;
}

/** What the last card or event option did, after all modifiers, before clamping. */
export interface TurnReport {
  source: { kind: "card"; cardId: string } | { kind: "event"; eventId: string; optionId: string };
  /** Authored points after modifiers, phase scaling, costs and drain. */
  effects: FullEffects;
  /** What actually changed on the score this turn, in users and euros. */
  delta: Record<ScoreKey, number>;
  modifiers: TurnModifiers;
}

/**
 * Full, serializable state of one run. Immutable: every engine call returns a new object.
 * `rngState` makes the run reproducible from `seed`.
 */
export interface GameState {
  seed: number;
  rngState: number;
  /** Card turns completed. Event resolutions are not turns. */
  turn: number;
  phase: PhaseId;
  /** Gebruikers, absolute; never below 0 (score-redesign D11, D16). */
  users: number;
  /** Geld in euros; below 0 is Bankroet. */
  money: number;
  /** Hidden 0–100; below the scandal threshold it sets the scandal chance (D13). */
  reputation: number;
  /** Hidden 0–100; drains reputation every card turn (D21). */
  toxicity: number;
  /** Highest Gebruikers of the run so far: end screens report this peak, since users can fall. */
  peakUsers: number;
  hand: Hand | null;
  /** Draw piles (deck-draw D1); null before the first hand. */
  deck: DrawDeck | null;
  pendingEventId: string | null;
  firedEventIds: string[];
  /** Card turn on which the last event opened, or null before the first (game-engine D10). */
  lastEventTurn: number | null;
  /** Earliest card turn on which a regular event may open: the seeded gap after the last one. */
  nextEventTurn: number;
  /** Card types played, oldest first. */
  playedTypes: CardType[];
  turnsWithoutNews: number;
  viralStreak: number;
  status: GameStatus;
  gameOver: GameOverReason | null;
  lastTurn: TurnReport | null;
}
