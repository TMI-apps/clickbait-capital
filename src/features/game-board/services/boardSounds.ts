import type { CardType, GameState, MeterKey } from "@/features/game-engine/api";
import type { SoundEffectId } from "@/features/game-audio/api";

/** A meter must move at least this much (0–100 scale) in one action to earn a meter blip. */
export const METER_CUE_THRESHOLD = 8;

const CARD_SOUNDS: Record<CardType, SoundEffectId> = {
  viral: "card-viral",
  ad: "card-ad",
  news: "card-news",
};

const METER_KEYS: MeterKey[] = ["revenue", "users", "reputation"];

/** The game's state change after one action, as one optional "big" sound (end, phase, event). */
const milestoneSound = (before: GameState, after: GameState): SoundEffectId | null => {
  if (after.status === "won") return "ipo-win";
  if (after.status === "lost") return "game-over";
  if (after.phase > before.phase) return "phase-up";
  if (after.status === "event" && before.status !== "event") return "event-appear";
  return null;
};

/** At most one subtle meter blip: a clear loss wins over a gain (the player should notice it). */
const meterSound = (before: GameState, after: GameState): SoundEffectId | null => {
  const deltas = METER_KEYS.map((key) => after.meters[key] - before.meters[key]);
  if (deltas.some((delta) => delta <= -METER_CUE_THRESHOLD)) return "meter-loss";
  if (deltas.some((delta) => delta >= METER_CUE_THRESHOLD)) return "meter-gain";
  return null;
};

/** Sounds earned by the last board action; `key` changes once per action so each plays once. */
export interface BoardSounds {
  ids: SoundEffectId[];
  key: number;
}

export interface BoardSoundAction {
  /** The card played, or `null` when an event option was chosen. */
  cardType: CardType | null;
  before: GameState;
  after: GameState;
}

/**
 * Sounds for one board action, in play order: the action itself (card type or event choice),
 * then either a milestone (end, phase, new event) or, when nothing bigger happened, one meter
 * blip. Pure, so the order is testable without audio.
 */
export const soundsForAction = ({ cardType, before, after }: BoardSoundAction): SoundEffectId[] => {
  const action: SoundEffectId = cardType ? CARD_SOUNDS[cardType] : "event-choice";
  const follow = milestoneSound(before, after) ?? meterSound(before, after);
  return follow ? [action, follow] : [action];
};
