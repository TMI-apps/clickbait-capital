import type { CardType, EventOptionKind, GameContent, GameState } from "@/features/game-engine/api";
import type { GameJuiceEmit } from "@/features/game-juice/api";
import type { SessionState } from "@/features/game-session/api";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

/** A number must move at least this share of its value in one action to earn the meter blip. */
export const METER_CUE_THRESHOLD = 0.1;

/** What a meter tile tells the juice about the last action. */
export type BoardJuiceMeter = Pick<MeterView, "key" | "amount" | "delta">;

export interface BoardJuiceAction {
  /** The card played, or null when an event option was chosen. */
  cardType: CardType | null;
  /** The chosen option's kind, or null for a card play. */
  optionKind: EventOptionKind | null;
  before: GameState;
  after: GameState;
  /** The tiles after the action: their change and amount. */
  meters: BoardJuiceMeter[];
}

/**
 * The juice of one board action, derived from the engine (juice-migrate D1). The action's own
 * moment (`card.played`, `event.choice`) is emitted by its handler, not here.
 */
export interface BoardJuice {
  /** Changes once per action (the session's step count). */
  key: number;
  /** Plays at once: what the action led to (run end, next phase, a new event). */
  followUp: GameJuiceEmit[];
  /** Plays on the board once the event dialog has closed: outcome, meters, the new post. */
  reveal: GameJuiceEmit[];
}

/** The milestone an action led to, or null (game-board D12 order: end, phase, event). */
function followUpFor(before: GameState, after: GameState): GameJuiceEmit | null {
  if (after.status === "won") return { name: "run.won", payload: {} };
  if (after.status === "lost") return { name: "run.lost", payload: {} };
  if (after.phase > before.phase) return { name: "phase.up", payload: {} };
  if (after.status === "event" && before.status !== "event")
    return { name: "event.appeared", payload: {} };
  return null;
}

/** How far a tile moved, as a share of its value before the action. */
const movedShare = ({ amount, delta }: BoardJuiceMeter): number =>
  delta / Math.max(1, Math.abs(amount - delta));

/**
 * The one tile that earns the meter blip: the first clear loss, else the first clear gain (the
 * player should notice a loss), or none.
 */
function blipMeter(meters: BoardJuiceMeter[]): BoardJuiceMeter["key"] | null {
  const loss = meters.find((meter) => movedShare(meter) <= -METER_CUE_THRESHOLD);
  const gain = meters.find((meter) => movedShare(meter) >= METER_CUE_THRESHOLD);
  return (loss ?? gain)?.key ?? null;
}

type MeterVariant = "gain" | "loss" | "gain-big" | "loss-big" | "dull";

interface MeterJuiceOptions {
  /** News and journalism stay dull: no flash, no blip (design § 5, juice-migrate D4). */
  dull: boolean;
  /** No blip when a milestone already speaks (game-board D12). */
  quiet: boolean;
}

function meterVariant(
  meter: BoardJuiceMeter,
  blip: BoardJuiceMeter["key"] | null,
  { dull }: MeterJuiceOptions
): MeterVariant {
  if (dull) return "dull";
  const direction = meter.delta > 0 ? "gain" : "loss";
  return meter.key === blip ? `${direction}-big` : direction;
}

/** One `meter.changed` per tile that moved. */
function meterChanges(meters: BoardJuiceMeter[], options: MeterJuiceOptions): GameJuiceEmit[] {
  const blip = options.dull || options.quiet ? null : blipMeter(meters);
  return meters
    .filter((meter) => meter.delta !== 0)
    .map((meter) => ({
      name: "meter.changed",
      payload: { variant: meterVariant(meter, blip, options), vars: { meter: meter.key } },
    }));
}

/**
 * The juice one action earns, in two groups: the follow-up plays at once, the reveal on the
 * board after the event dialog has closed (event-juice-drop D3). Pure, so the rules are
 * testable without a DOM.
 */
export function juiceForAction(action: BoardJuiceAction): Omit<BoardJuice, "key"> {
  const { cardType, optionKind, before, after, meters } = action;
  const followUp = followUpFor(before, after);
  const dull = cardType === "news" || optionKind === "journalism";
  const resolved: GameJuiceEmit[] = optionKind
    ? [{ name: "event.resolved", payload: { variant: optionKind } }]
    : [];
  return {
    followUp: followUp ? [followUp] : [],
    reveal: [
      ...resolved,
      ...meterChanges(meters, { dull, quiet: followUp !== null }),
      { name: "feed.landed", payload: { variant: cardType ?? "event" } },
    ],
  };
}

/** The kind of the option a step chose, or null. */
function optionKindOf(
  step: SessionState["steps"][number],
  content: GameContent
): EventOptionKind | null {
  const { action } = step;
  if (action.kind !== "option") return null;
  const event = content.events.find((candidate) => candidate.id === step.eventId);
  return event?.options.find((option) => option.id === action.optionId)?.kind ?? null;
}

/**
 * The juice of the session's last action, keyed by its step count. Empty before the first
 * action and for steps replayed from a save (a resume is silent).
 */
export function juiceForLastStep(
  session: SessionState,
  { content, meters }: { content: GameContent; meters: BoardJuiceMeter[] }
): BoardJuice {
  const { game, previousGame, steps, replayedStepCount } = session;
  const key = steps.length;
  const last = steps.length > 0 ? steps[steps.length - 1] : undefined;
  if (!last || !previousGame || steps.length <= replayedStepCount)
    return { key, followUp: [], reveal: [] };
  const { action } = last;
  const cardType =
    action.kind === "card"
      ? (content.cards.find((card) => card.id === action.cardId)?.type ?? null)
      : null;
  return {
    key,
    ...juiceForAction({
      cardType,
      optionKind: optionKindOf(last, content),
      before: previousGame,
      after: game,
      meters,
    }),
  };
}
