import type {
  CardDefinition,
  CardType,
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
  scaleForPhase,
} from "@/features/game-engine/api";
import type {
  CardEffectView,
  DraftCardView,
  EventView,
  FeedEntry,
  GameEndView,
  MeterView,
  PhaseProgressView,
} from "@/features/game-board/types/gameBoard.types";

/** Meter order on the board and on cards (design § 2). */
export const METER_ORDER: MeterKey[] = ["revenue", "users", "reputation"];

/** Draft order: one card per type, left to right. */
const DRAFT_ORDER: CardType[] = ["viral", "ad", "news"];

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

/** The three meters with their change against the meters before the last action. */
export function toMeters(state: GameState, previous: Record<MeterKey, number> | null): MeterView[] {
  return METER_ORDER.map((key) => ({
    key,
    value: state.meters[key],
    delta: previous ? state.meters[key] - previous[key] : 0,
  }));
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
 * Visible effects as the engine applies them in the current phase (game-content README:
 * events show scaled numbers). Turn modifiers such as Ad-Fatigue are not previewed.
 */
function scaledEffects(effects: Effects, phase: PhaseDefinition): CardEffectView[] {
  return toCardEffects(scaleForPhase(effects, phase));
}

/** Labels for the absolute stats; "Bereik" keeps reach apart from the Gebruikers meter. */
const STAT_LABEL: Record<StatKey, string> = { users: "Bereik", revenue: "Omzet" };

function formatStat(stat: StatKey, value: number): string {
  return stat === "revenue" ? euroFormat.format(value) : countFormat.format(value);
}

function goalStatTexts(conditions: GoalCondition[], state: GameState): string[] {
  return conditions.flatMap((condition) =>
    condition.kind === "stat"
      ? [
          `${STAT_LABEL[condition.stat]}: ${formatStat(condition.stat, state.stats[condition.stat])} / ${formatStat(condition.stat, condition.atLeast)}`,
        ]
      : []
  );
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
    goalStats: goalStatTexts(conditions, state),
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
  return DRAFT_ORDER.map((type) => {
    const card = hand[type];
    return {
      id: card.id,
      type,
      title: card.title,
      body: card.body,
      flavor: flavorOf(card),
      effects: scaledEffects(card.effects, phase),
      droughtWarning: drought && type === "viral",
    };
  });
}

/** The pending event with its options, or null. */
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
    options: event.options.map(({ id, kind, label, effects }) => ({
      id,
      kind,
      label,
      effects: scaledEffects(effects, phase),
    })),
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
    stats: { ...state.stats },
    statTexts: {
      users: formatStat("users", state.stats.users),
      revenue: formatStat("revenue", state.stats.revenue),
    },
    playedTypes: [...state.playedTypes],
    firedEventIds: [...state.firedEventIds],
  };
}

/** Feed post for a played card. `turn` keeps keys unique when a card is drawn again. */
export function feedEntryForCard(card: CardDefinition, turn: number): FeedEntry {
  return { key: `card-${turn}-${card.id}`, type: card.type, title: card.title, body: card.body };
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
    type: "event",
    title: event.title,
    body: option?.label ?? event.body,
  };
}
