import type {
  CardDefinition,
  Effects,
  EventDefinition,
  GameContent,
  GameState,
  MeterKey,
  PhaseDefinition,
  ScoreKey,
} from "@/features/game-engine/api";
import {
  eventOptionEffects,
  getHandCards,
  getPendingEvent,
  isJournalismDroughtActive,
  scaleForPhase,
  scandalChance,
} from "@/features/game-engine/api";
import type { SessionStep } from "@/features/game-session/api";
import type {
  CardEffectView,
  DraftCardView,
  EventView,
  FeedEntry,
  GameEndView,
  MeterView,
  PhaseProgressView,
  ScandalRiskView,
} from "@/features/game-board/types/gameBoard.types";
import { SCORE_HISTORY_POINTS } from "@/features/game-board/types/gameBoard.types";
import { stripGlossaryMarkup } from "@/shared/utils/glossaryMarkup";

/**
 * Effect rows on cards and event options (score-redesign D13, D23): Geld and Gebruikers only.
 * Reputation and Toxicity stay hidden.
 */
export const METER_ORDER: MeterKey[] = ["revenue", "users"];

const countFormat = new Intl.NumberFormat("nl-NL");
const euroFormat = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Visible effects of a card (reputation and Toxicity stay hidden, zeros are left out). */
export function toCardEffects(effects: Effects): CardEffectView[] {
  return METER_ORDER.flatMap((meter) => {
    const delta = effects[meter] ?? 0;
    return delta === 0 ? [] : [{ meter, delta }];
  });
}

/** Geld at or below this many turns of passive costs is in danger: Bankroet is near. */
const MONEY_DANGER_TURNS = 3;

const SCORE_LABEL: Record<ScoreKey, string> = { users: "Gebruikers", money: "Geld" };

/** "120.000" for users, "€ 120.000" for money. */
export function formatScore(key: ScoreKey, value: number): string {
  return key === "money" ? euroFormat.format(value) : countFormat.format(value);
}

/** "+12.000" / "−€ 5.000"; empty for 0. */
function formatScoreDelta(key: ScoreKey, delta: number): string {
  if (delta === 0) return "";
  return `${delta > 0 ? "+" : "−"}${formatScore(key, Math.abs(delta))}`;
}

function currentPhase(state: GameState, content: GameContent): PhaseDefinition {
  const phase = content.phases.find((candidate) => candidate.id === state.phase);
  if (!phase) {
    throw new Error(`game-board: phase ${state.phase} is missing from the content`);
  }
  return phase;
}

/** The tile key (juice keeps the meter keys) for each score number. */
const SCORE_TILES: Array<{ key: MeterView["key"]; score: ScoreKey }> = [
  { key: "users", score: "users" },
  { key: "revenue", score: "money" },
];

function tileValueText(label: string, tile: Omit<MeterView, "key" | "valueText">): string {
  const parts = [`${label} ${tile.amountText}`];
  if (tile.deltaText) parts.push(tile.deltaText);
  parts.push(tile.goalText);
  if (tile.full) parts.push("doel gehaald");
  if (tile.danger) parts.push("bijna bankroet");
  return parts.join(", ");
}

/**
 * The two score tiles (score-redesign D23): absolute amount, the last action's change, and a
 * bar for the progress to this phase's goal line.
 */
/**
 * Users and money at the start of the current phase and after every action in it, oldest
 * first (the chart's lines). Phase 1 starts at the balance's start values; a later phase at the
 * state of the action that entered it.
 */
export function toScoreHistory(
  state: GameState,
  steps: readonly SessionStep[],
  content: GameContent
): Array<Record<ScoreKey, number>> {
  const inPhase = steps
    .filter((step) => step.state.phase === state.phase)
    .map((step) => step.state);
  const start =
    state.phase === 1
      ? [{ users: content.balance.startUsers, money: content.balance.startMoney }]
      : [];
  const points = [...start, ...inPhase.map(({ users, money }) => ({ users, money }))];
  const current = { users: state.users, money: state.money };
  const last = points[points.length - 1];
  if (!last || last.users !== current.users || last.money !== current.money) points.push(current);
  return points.slice(-SCORE_HISTORY_POINTS);
}

export function toMeters(
  state: GameState,
  content: GameContent,
  steps: readonly SessionStep[] = []
): MeterView[] {
  const phase = currentPhase(state, content);
  const history = toScoreHistory(state, steps, content);
  const costPerTurn = -(phase.passiveCosts.revenue ?? 0) * phase.moneyPerPoint;
  return SCORE_TILES.map(({ key, score }) => {
    const amount = state[score];
    const goal = phase.goal[score];
    const delta = state.lastTurn?.delta[score] ?? 0;
    const share = (value: number): number => (goal <= 0 ? 1 : Math.max(0, value) / goal);
    const tile = {
      value: Math.round(Math.min(1, share(amount)) * 100),
      history: history.map((point) => share(point[score])),
      amount,
      amountText: formatScore(score, amount),
      delta,
      deltaText: formatScoreDelta(score, delta),
      goalText: `Doel: ${formatScore(score, goal)}`,
      goalAmountText: formatScore(score, goal),
      full: amount >= goal,
      danger: score === "money" && amount <= costPerTurn * MONEY_DANGER_TURNS,
    };
    return { key, ...tile, valueText: tileValueText(SCORE_LABEL[score], tile) };
  });
}

/** The scandal warning while reputation is below the threshold (score-redesign D13), else null. */
export function toScandalRisk(state: GameState, content: GameContent): ScandalRiskView | null {
  const chance = scandalChance(state.reputation, content.balance.scandal);
  if (chance <= 0) return null;
  return { chance, text: `Schandaal dreigt: ${Math.round(chance * 100)}% kans per beurt` };
}

/**
 * Visible effects as the engine applies them in the current phase (game-content README:
 * events show scaled numbers). Turn modifiers such as Ad-Fatigue are not previewed.
 */
function scaledEffects(effects: Effects, phase: PhaseDefinition): CardEffectView[] {
  return toCardEffects(scaleForPhase(effects, phase));
}

/** Phase name, goal text and progress: the lower of the two goal lines, capped at 1. */
export function toPhaseProgress(state: GameState, content: GameContent): PhaseProgressView {
  const phase = currentPhase(state, content);
  const { goal } = phase;
  const ratio = (score: ScoreKey): number =>
    goal[score] <= 0 ? 1 : Math.max(0, state[score]) / goal[score];
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    phaseCount: content.phases.length,
    goalDescription: goal.description,
    progress: Math.max(0, Math.min(1, ratio("users"), ratio("money"))),
    goalStats: (["users", "money"] as const).map(
      (score) =>
        `${SCORE_LABEL[score]}: ${formatScore(score, state[score])} / ${formatScore(score, goal[score])}`
    ),
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
      effects: scaledEffects(card.effects, phase),
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
    options: seededOrder(event.options, `${state.seed}:${event.id}`).map((option) => ({
      id: option.id,
      kind: option.kind,
      label: option.label,
      effects: toCardEffects(eventOptionEffects(option, phase)),
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
    // End screens report the run's peak users (game-board D11): users can fall again.
    score: { users: state.peakUsers, money: state.money },
    statTexts: {
      users: formatScore("users", state.peakUsers),
      money: formatScore("money", state.money),
    },
    playedTypes: [...state.playedTypes],
    firedEventIds: [...state.firedEventIds],
  };
}

/** A feed post before it is placed in the run (`toFeed` adds its step). */
type FeedPost = Omit<FeedEntry, "step">;

/** Feed post for a played card. `turn` keeps keys unique when a card is drawn again. */
export function feedEntryForCard(card: CardDefinition, turn: number): FeedPost {
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
): FeedPost {
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
const feedEntryForStep = (step: SessionStep, content: GameContent): FeedPost | null => {
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
    if (entry) feed.push({ ...entry, step: index });
  }
  return feed;
}
