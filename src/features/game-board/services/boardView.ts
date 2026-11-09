import type {
  CardDefinition,
  Effects,
  EventDefinition,
  GameContent,
  GameState,
  GoalCondition,
  MeterKey,
  PhaseDefinition,
  StatKey,
} from "@/features/game-engine/api";
import {
  getHandCards,
  getPendingEvent,
  isJournalismDroughtActive,
  meterForUsers,
  scaleForPhase,
} from "@/features/game-engine/api";
import type { SessionStep } from "@/features/game-session/api";
import { meterValueText } from "@/features/game-board/services/boardSpeech";
import type {
  CardEffectView,
  DraftCardView,
  EventView,
  FeedEntry,
  GameEndView,
  MeterView,
  PhaseProgressView,
} from "@/features/game-board/types/gameBoard.types";
import { stripGlossaryMarkup } from "@/shared/utils/glossaryMarkup";

/** Meter order on the board and on cards (design § 2). */
export const METER_ORDER: MeterKey[] = ["revenue", "users", "reputation"];

const countFormat = new Intl.NumberFormat("nl-NL");
const euroFormat = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Visible meter effects of a card (Toxicity stays hidden, zeros are left out). */
export function toCardEffects(effects: Effects): CardEffectView[] {
  return METER_ORDER.flatMap((meter) => {
    const delta = effects[meter] ?? 0;
    return delta === 0 ? [] : [{ meter, delta }];
  });
}

/**
 * Meters cap at 100; gains past it are wasted. Second copy: the engine clamps with
 * `METER_MAX` in `src/features/game-engine/services/turnEffects.ts` (not exported); export it
 * from the engine api and use it here when a third consumer appears (code-style § Naming F2).
 */
const METER_CAP = 100;

/** At or below this a meter is in danger (game over at 0); the board and the turn announcement say so. */
const METER_DANGER_AT = 20;

/** The three meters with their change against the meters before the last action. */
export function toMeters(state: GameState, previous: Record<MeterKey, number> | null): MeterView[] {
  return METER_ORDER.map((key) => {
    const meter = {
      value: state.meters[key],
      delta: previous ? state.meters[key] - previous[key] : 0,
      full: state.meters[key] >= METER_CAP,
      danger: state.meters[key] <= METER_DANGER_AT,
    };
    return { key, ...meter, valueText: meterValueText(meter) };
  });
}

function conditionRatio(condition: GoalCondition, state: GameState): number {
  if (condition.kind === "stat") {
    return condition.atLeast <= 0 ? 1 : state.stats[condition.stat] / condition.atLeast;
  }
  return condition.above <= 0 ? 1 : state.meters[condition.meter] / condition.above;
}

function currentPhase(state: GameState, content: GameContent): PhaseDefinition {
  const phase = content.phases.find((candidate) => candidate.id === state.phase);
  if (!phase) {
    throw new Error(`game-board: phase ${state.phase} is missing from the content`);
  }
  return phase;
}

/**
 * Splits gains at the meter cap (game-juice D5): `delta` keeps the part that still counts and
 * `overflow` the wasted rest, so the card shows "+4 MAX" instead of "+12" at a meter of 96.
 * Card effects only: passive costs and turn modifiers are not previewed (D10).
 */
export function capEffects(
  effects: CardEffectView[],
  meters: Record<MeterKey, number>
): CardEffectView[] {
  return effects.map((effect) => {
    const room = Math.max(0, METER_CAP - meters[effect.meter]);
    if (effect.delta <= room) return effect;
    return { ...effect, delta: room, overflow: effect.delta - room };
  });
}

/**
 * Visible effects as the engine applies them in the current phase (game-content README:
 * events show scaled numbers), capped at the meters' room. Turn modifiers such as Ad-Fatigue
 * are not previewed.
 */
function scaledEffects(
  effects: Effects,
  phase: PhaseDefinition,
  state: GameState
): CardEffectView[] {
  return capEffects(toCardEffects(scaleForPhase(effects, phase)), state.meters);
}

/** Labels for the absolute stats; "Bereik" is the number behind the Gebruikers meter (engine D1). */
const STAT_LABEL: Record<StatKey, string> = { users: "Bereik", revenue: "Omzet" };

function formatStat(stat: StatKey, value: number): string {
  return stat === "revenue" ? euroFormat.format(value) : countFormat.format(value);
}

/**
 * "Bereik: x / doel (Gebruikers ≥ N)": the users stat is read off the Gebruikers meter
 * (game-engine D1), so the line names the meter level that reaches the goal in this phase.
 */
function goalStatText(
  condition: Extract<GoalCondition, { kind: "stat" }>,
  state: GameState,
  phase: PhaseDefinition
): string {
  const { stat, atLeast } = condition;
  const text = `${STAT_LABEL[stat]}: ${formatStat(stat, state.stats[stat])} / ${formatStat(stat, atLeast)}`;
  return stat === "users" ? `${text} (Gebruikers ≥ ${meterForUsers(atLeast, phase)})` : text;
}

/** Phase name, goal text and progress. Progress is the weakest goal condition, capped at 1. */
export function toPhaseProgress(state: GameState, content: GameContent): PhaseProgressView {
  const phase = currentPhase(state, content);
  const { conditions, consecutiveTurns, description } = phase.goal;
  const ratios = conditions.map((condition) => conditionRatio(condition, state));
  const progress = Math.max(0, Math.min(1, ...ratios));
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    phaseCount: content.phases.length,
    goalDescription: description,
    progress,
    streak: consecutiveTurns > 1 ? { current: state.goalStreak, required: consecutiveTurns } : null,
    goalStats: conditions.flatMap((condition) =>
      condition.kind === "stat" ? [goalStatText(condition, state, phase)] : []
    ),
    usersText: `${STAT_LABEL.users}: ${formatStat("users", state.stats.users)}`,
    revenueText: `${STAT_LABEL.revenue}: ${formatStat("revenue", state.stats.revenue)}`,
    turn: state.turn,
  };
}

/** Flavor line when the content adds one next to the engine schema (game-content D2). */
function flavorOf(card: CardDefinition): string | undefined {
  const flavor: unknown = (card as CardDefinition & { flavor?: unknown }).flavor;
  return typeof flavor === "string" && flavor !== "" ? flavor : undefined;
}

/** The open draft as board cards, or an empty list while an event or the end is showing. */
export function toDraft(state: GameState, content: GameContent): DraftCardView[] {
  const hand = state.status === "playing" ? getHandCards(state, content) : null;
  if (!hand) {
    return [];
  }
  const drought = isJournalismDroughtActive(state, content);
  const phase = currentPhase(state, content);
  return hand.map((card) => {
    const { type } = card;
    return {
      id: card.id,
      type,
      title: card.title,
      body: card.body,
      flavor: flavorOf(card),
      effects: scaledEffects(card.effects, phase, state),
      droughtWarning: drought && type === "viral",
    };
  });
}

/**
 * 53-bit string hash (cyrb53). Second copy: `error-reporting/services/errorFingerprint.ts` has
 * the same function; a third user should extract both to `src/shared/utils/` (code-style F2).
 */
const cyrb53 = (input: string): number => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Deterministic shuffle: items sorted by the hash of `key` + their id, so a resumed or replayed
 * run shows the same order, and tests can pin it (event-redesign D5).
 */
function seededOrder<T extends { id: string }>(items: readonly T[], key: string): T[] {
  return items
    .map((item) => ({ item, rank: cyrb53(`${key}:${item.id}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
}

/**
 * The pending event with its options, or null. Options come in an order shuffled per run and
 * event (seed + event id), so the first letter is not always the money option (event-redesign D5).
 */
export function toEventView(state: GameState, content: GameContent): EventView | null {
  const event = state.status === "event" ? getPendingEvent(state, content) : null;
  if (!event) {
    return null;
  }
  const phase = currentPhase(state, content);
  return {
    id: event.id,
    title: event.title,
    body: event.body,
    options: seededOrder(event.options, `${state.seed}:${event.id}`).map(
      ({ id, kind, label, effects }) => ({
        id,
        kind,
        label,
        effects: scaledEffects(effects, phase, state),
      })
    ),
  };
}

/** The run summary for the end screens, or null while the run goes on. */
export function toGameEnd(state: GameState, content: GameContent): GameEndView | null {
  const ended = state.status === "won" || (state.status === "lost" && state.gameOver !== null);
  if (!ended) {
    return null;
  }
  return {
    outcome: state.status === "won" ? "won" : "lost",
    reason: state.status === "won" ? null : state.gameOver,
    turn: state.turn,
    phaseId: state.phase,
    phaseName: currentPhase(state, content).name,
    // End screens report the run's peak reach (game-board D11): the users stat follows the
    // meter and can end below a goal the player already held.
    stats: { ...state.stats, users: state.peakUsers },
    statTexts: {
      users: formatStat("users", state.peakUsers),
      revenue: formatStat("revenue", state.stats.revenue),
    },
    playedTypes: [...state.playedTypes],
    firedEventIds: [...state.firedEventIds],
  };
}

/** Feed post for a played card. `turn` keeps keys unique when a card is drawn again. */
export function feedEntryForCard(card: CardDefinition, turn: number): FeedEntry {
  return {
    key: `card-${turn}-${card.id}`,
    contentId: card.id,
    type: card.type,
    title: card.title,
    body: stripGlossaryMarkup(card.body),
  };
}

/** Feed post for a resolved event: the event title plus the chosen policy. */
export function feedEntryForEvent(
  event: EventDefinition,
  optionId: string,
  turn: number
): FeedEntry {
  const option = event.options.find((candidate) => candidate.id === optionId);
  return {
    key: `event-${turn}-${event.id}`,
    contentId: event.id,
    type: "event",
    title: event.title,
    body: stripGlossaryMarkup(option?.label ?? event.body),
    optionKind: option?.kind,
  };
}

/** One feed post for an accepted session step; null when the content no longer has it. */
const feedEntryForStep = (step: SessionStep, content: GameContent): FeedEntry | null => {
  const { action, turn, eventId } = step;
  if (action.kind === "card") {
    const card = content.cards.find((candidate) => candidate.id === action.cardId);
    return card ? feedEntryForCard(card, turn) : null;
  }
  const event = content.events.find((candidate) => candidate.id === eventId);
  return event ? feedEntryForEvent(event, action.optionId, turn) : null;
};

/** The phone feed for a run: one post per accepted step, newest first. */
export function toFeed(steps: SessionStep[], content: GameContent): FeedEntry[] {
  const feed: FeedEntry[] = [];
  for (let index = steps.length - 1; index >= 0; index--) {
    const entry = feedEntryForStep(steps[index], content);
    if (entry) feed.push(entry);
  }
  return feed;
}
