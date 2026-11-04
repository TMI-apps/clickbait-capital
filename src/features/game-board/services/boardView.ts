import type {
  CardDefinition,
  CardType,
  Effects,
  EventDefinition,
  GameContent,
  GameOverReason,
  GameState,
  GoalCondition,
  MeterKey,
} from "@/features/game-engine/api";
import {
  getHandCards,
  getPendingEvent,
  isJournalismDroughtActive,
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

/**
 * Minimal Dutch end texts (design § 2 and § 6). The full endings with the end report come
 * in the game-flow lap; these only say what happened.
 */
const GAME_OVER_TEXT: Record<GameOverReason, { title: string; message: string }> = {
  bankrupt: {
    title: "Bankroet",
    message:
      "De servers gaan offline wegens onbetaalde rekeningen. Je investeerders trekken de stekker eruit.",
  },
  abandoned: {
    title: "Verlaten platform",
    message: "Je gebruikers lopen massaal over naar concurrerende apps. De feed sterft uit.",
  },
  banned: {
    title: "Verbod & regulering",
    message: "Je platform wordt verboden wegens maatschappelijke ontwrichting.",
  },
};

const WIN_TEXT = {
  title: "Beursgang geslaagd",
  message: "Je platform staat op de beurs. Maar tegen welke prijs?",
};

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

/** Phase name, goal text and progress. Progress is the weakest goal condition, capped at 1. */
export function toPhaseProgress(state: GameState, content: GameContent): PhaseProgressView {
  const phase = content.phases.find((candidate) => candidate.id === state.phase);
  if (!phase) {
    throw new Error(`game-board: phase ${state.phase} is missing from the content`);
  }
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
    usersText: `${countFormat.format(state.stats.users)} gebruikers`,
    revenueText: `${euroFormat.format(state.stats.revenue)} omzet`,
    turn: state.turn,
  };
}

/** The open draft as board cards, or an empty list while an event or the end is showing. */
export function toDraft(state: GameState, content: GameContent): DraftCardView[] {
  const hand = state.status === "playing" ? getHandCards(state, content) : null;
  if (!hand) {
    return [];
  }
  const drought = isJournalismDroughtActive(state, content);
  return DRAFT_ORDER.map((type) => {
    const card = hand[type];
    return {
      id: card.id,
      type,
      title: card.title,
      body: card.body,
      effects: toCardEffects(card.effects),
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
  return {
    id: event.id,
    title: event.title,
    body: event.body,
    options: event.options.map(({ id, kind, label }) => ({ id, kind, label })),
  };
}

/** Win or game over text, or null while the run goes on. */
export function toGameEnd(state: GameState): GameEndView | null {
  if (state.status === "won") {
    return { outcome: "won", reason: null, ...WIN_TEXT };
  }
  if (state.status === "lost" && state.gameOver) {
    return { outcome: "lost", reason: state.gameOver, ...GAME_OVER_TEXT[state.gameOver] };
  }
  return null;
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
