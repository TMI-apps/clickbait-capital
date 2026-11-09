import type {
  CardType,
  FullEffects,
  MeterKey,
  PhaseId,
  StatKey,
} from "@/features/game-engine/types/gameContent.types";

/** Why a game ended: Bankroet (revenue 0), Verlaten Platform (users 0), Verbod & Regulering (reputation 0). */
export type GameOverReason = "bankrupt" | "abandoned" | "banned";

/** `event`: a draft is interrupted until `resolveEvent` is called. */
export type GameStatus = "playing" | "event" | "won" | "lost";

/** The draft: different card ids in slot order, any mix of types (shuffled-hand D1). */
export type Hand = readonly string[];

/** Which correction rules changed the last card (for UI feedback such as red borders). */
export interface TurnModifiers {
  adFatigue: boolean;
  echoChamber: boolean;
  journalismDrought: boolean;
  reputationDecay: boolean;
}

/** What the last card or event option did, after all modifiers, before clamping. */
export interface TurnReport {
  source: { kind: "card"; cardId: string } | { kind: "event"; eventId: string; optionId: string };
  effects: FullEffects;
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
  meters: Record<MeterKey, number>;
  /** Hidden from the player; drives toxicity events. */
  toxicity: number;
  stats: Record<StatKey, number>;
  /**
   * Highest users stat of the run so far (game-engine D1). The stat follows the meter and
   * can fall, so end screens report this peak instead of the last value.
   */
  peakUsers: number;
  hand: Hand | null;
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
  /** Consecutive turns the current phase goal has held. */
  goalStreak: number;
  status: GameStatus;
  gameOver: GameOverReason | null;
  lastTurn: TurnReport | null;
}
