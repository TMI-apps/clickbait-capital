import type { CardType, EventOptionKind, GameContent, GameState } from "@/features/game-engine/api";
import {
  STREAK_LEVELS,
  chartGainVariant,
  chartMoveVariant,
  streakStepVariant,
  type GameJuiceEmit,
  type JuiceScandalLevel,
} from "@/features/game-juice/api";
import type { SessionState } from "@/features/game-session/api";
import { streakOf } from "@/features/game-board/services/boardView";
import type { MeterView, ScandalRiskView } from "@/features/game-board/types/gameBoard.types";

/** A number must move at least this share of its value in one action to earn the meter blip. */
export const METER_CUE_THRESHOLD = 0.1;

/** What a meter tile tells the juice about the last action. */
export type BoardJuiceMeter = Pick<MeterView, "key" | "amount" | "delta"> &
  Partial<Pick<MeterView, "deltaText" | "history">>;

export interface BoardJuiceAction {
  /** The card played, or null when an event option was chosen. */
  cardType: CardType | null;
  /** The chosen option's kind, or null for a card play. */
  optionKind: EventOptionKind | null;
  before: GameState;
  after: GameState;
  /** The tiles after the action: their change and amount. */
  meters: BoardJuiceMeter[];
  /** The event the action opened is a scandal (its sting is `scandal.hit`, lap-3 D2). */
  openedScandal?: boolean;
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
function followUpFor({ before, after, openedScandal }: BoardJuiceAction): GameJuiceEmit | null {
  if (after.status === "won") return { name: "run.won", payload: {} };
  if (after.status === "lost") return { name: "run.lost", payload: {} };
  if (after.phase > before.phase) return { name: "phase.up", payload: {} };
  if (after.status === "event" && before.status !== "event")
    return { name: openedScandal ? "scandal.hit" : "event.appeared", payload: {} };
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
      payload: {
        variant: meterVariant(meter, blip, options),
        vars: { meter: meter.key, text: meter.deltaText },
      },
    }));
}

/** The chart and streak juice of one line's newest move (chart-juice D1–D4), or nothing. */
function lineJuice(meter: BoardJuiceMeter, dull: boolean): GameJuiceEmit[] {
  const history = meter.history ?? [];
  if (history.length < 2) return [];
  const move = history[history.length - 1]! - history[history.length - 2]!;
  const vars = { meter: meter.key };
  const emits: GameJuiceEmit[] =
    move === 0
      ? []
      : [
          {
            name: "chart.moved",
            payload: { variant: chartMoveVariant(meter.key, move, dull), vars },
          },
        ];
  const gain = chartGainVariant(meter.key, move, dull);
  if (gain) emits.push({ name: "chart.gain", payload: { variant: gain, vars } });
  const count = streakOf(history);
  const before = streakOf(history.slice(0, -1));
  const step = streakStepVariant(count);
  // News extends a streak silently (design § 5); a streak that ends always shrugs.
  if (count > before && step && !dull)
    emits.push({ name: "streak.step", payload: { variant: step, vars: { ...vars, count } } });
  if (count === 0 && before >= STREAK_LEVELS[0])
    emits.push({ name: "streak.broken", payload: { vars: { ...vars, count: before } } });
  return emits;
}

/**
 * The juice one action earns, in two groups: the follow-up plays at once, the reveal on the
 * board after the event dialog has closed (event-juice-drop D3). Pure, so the rules are
 * testable without a DOM.
 */
export function juiceForAction(action: BoardJuiceAction): Omit<BoardJuice, "key"> {
  const { cardType, optionKind, meters } = action;
  const followUp = followUpFor(action);
  const dull = cardType === "news" || optionKind === "journalism";
  const resolved: GameJuiceEmit[] = optionKind
    ? [{ name: "event.resolved", payload: { variant: optionKind } }]
    : [];
  const landed: GameJuiceEmit = { name: "feed.landed", payload: { variant: cardType ?? "event" } };
  const meterJuice = [
    ...meterChanges(meters, { dull, quiet: followUp !== null }),
    ...meters.flatMap((meter) => lineJuice(meter, dull)),
  ];
  // An event post appears behind its closing dialog, so it enters at once (as the old CSS did);
  // replaying its entrance after the dialog would blink a post that is already visible.
  if (optionKind)
    return {
      followUp: [landed, ...(followUp ? [followUp] : [])],
      reveal: [...resolved, ...meterJuice],
    };
  return { followUp: followUp ? [followUp] : [], reveal: [...meterJuice, landed] };
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
  const opened = content.events.find((event) => event.id === game.pendingEventId);
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
      openedScandal: opened?.trigger.kind === "scandal",
    }),
  };
}

/** What a tile tells the goal and danger moments: reached its goal line, near Bankroet. */
export type BoardMomentMeter = Pick<MeterView, "key" | "full" | "danger">;

/**
 * The moments between two shown boards (lap-3 D1): a goal line reached, Geld entering the danger
 * zone. Only edges count, so a tile that stays full or in danger plays nothing again.
 */
export function meterMoments(
  before: readonly BoardMomentMeter[],
  after: readonly BoardMomentMeter[]
): GameJuiceEmit[] {
  return after.flatMap((meter): GameJuiceEmit[] => {
    const was = before.find((previous) => previous.key === meter.key);
    if (!was) return [];
    const moments: GameJuiceEmit[] = [];
    if (meter.full && !was.full)
      moments.push({ name: "goal.reached", payload: { vars: { meter: meter.key } } });
    if (meter.danger && !was.danger) moments.push({ name: "money.danger", payload: {} });
    return moments;
  });
}

/** The scandal warning's level (lap-3 D3): 0 without a warning, then 1–3 by the chance per turn. */
export function scandalLevel(scandal: Pick<ScandalRiskView, "chance"> | null): 0 | 1 | 2 | 3 {
  if (!scandal) return 0;
  if (scandal.chance < 0.25) return 1;
  return scandal.chance < 0.5 ? 2 : 3;
}

/**
 * What a change of the warning's level plays: its ramp when it appears or rises, a stop when it
 * goes away, nothing when it falls but stays.
 */
export function scandalWarningJuice(before: number, after: number): "stop" | GameJuiceEmit | null {
  if (after === 0) return before > 0 ? "stop" : null;
  if (after <= before) return null;
  const variant = String(after) as JuiceScandalLevel;
  return { name: "scandal.warning", payload: { variant } };
}
