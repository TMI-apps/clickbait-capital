import type {
  CardDefinition,
  EventDefinition,
  GameContent,
  GameState,
  MeterKey,
  PhaseDefinition,
  ScoreKey,
} from "@/features/game-engine/api";
import {
  getHandCards,
  getPendingEvent,
  playCard,
  resolveEvent,
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
  ScoreMarkerView,
} from "@/features/game-board/types/gameBoard.types";
import { stripGlossaryMarkup } from "@/shared/utils/glossaryMarkup";

const countFormat = new Intl.NumberFormat("nl-NL");
const millionFormat = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });
const MILLION = 1_000_000;

/** Geld at or below this many turns of passive costs is in danger: Bankroet is near. */
const MONEY_DANGER_TURNS = 3;

const SCORE_LABEL: Record<ScoreKey, string> = { users: "Gebruikers", money: "Geld" };

/**
 * "120.000", and from a million on "1,2 mln" so growing numbers stay short on cards and tiles
 * (exponential-growth D4). Not negative: callers add the sign.
 */
function formatAmount(value: number): string {
  return value >= MILLION
    ? `${millionFormat.format(value / MILLION)} mln`
    : countFormat.format(Math.round(value));
}

/** "120.000" for users, "€ 120.000" for money; a debt reads "−€ 24.000" like the change chips. */
export function formatScore(key: ScoreKey, value: number): string {
  if (key !== "money") return formatAmount(value);
  const euros = `€\u00a0${formatAmount(Math.abs(value))}`;
  return value < 0 ? `−${euros}` : euros;
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
/** One point of the score timeline: both numbers, their phase, and the event answered there. */
export interface ScorePoint extends Record<ScoreKey, number> {
  phase: GameState["phase"];
  /** The action at this point answered a scandal or a world (milestone) event. */
  event?: "scandal" | "world";
}

/** Which kind of event a step answered, or undefined for a card play. */
function eventKindOf(step: SessionStep, content: GameContent): ScorePoint["event"] {
  if (step.eventId === null) return undefined;
  const event = content.events.find((candidate) => candidate.id === step.eventId);
  return event?.trigger.kind === "scandal" ? "scandal" : "world";
}

/**
 * Users and money over the whole run, oldest first (the chart's lines, chart-timeline D1): the
 * balance's start values (turn 0), the state after every accepted action, and the current state
 * when it differs from the last point. Built from the session steps, which a resumed run rebuilds
 * by replay, so the timeline survives a reload without a save change.
 */
export function toScoreHistory(
  state: GameState,
  steps: readonly SessionStep[],
  content: GameContent
): ScorePoint[] {
  const points: ScorePoint[] = [
    { users: content.balance.startUsers, money: content.balance.startMoney, phase: 1 },
    ...steps.map((step): ScorePoint => {
      const { users, money, phase } = step.state;
      const event = eventKindOf(step, content);
      return event ? { users, money, phase, event } : { users, money, phase };
    }),
  ];
  const last = points[points.length - 1]!;
  if (last.users !== state.users || last.money !== state.money || last.phase !== state.phase) {
    points.push({ users: state.users, money: state.money, phase: state.phase });
  }
  return points;
}

/** Event tick colours (chart-timeline D3): scandals in the danger colour, world events in the brand colour. */
const EVENT_TONES: Record<NonNullable<ScorePoint["event"]>, string> = {
  scandal: "text-destructive",
  world: "text-primary",
};

/**
 * The chart's time-axis marks (chart-timeline D3): a divider labelled "F2" where each later
 * phase began, and a tick at every answered scandal or world event.
 */
export function toScoreMarkers(
  state: GameState,
  steps: readonly SessionStep[],
  content: GameContent
): ScoreMarkerView[] {
  const points = toScoreHistory(state, steps, content);
  return points.flatMap((point, index): ScoreMarkerView[] => {
    const marks: ScoreMarkerView[] = [];
    if (index > 0 && point.phase !== points[index - 1]!.phase) {
      marks.push({ index, kind: "divider", label: `F${point.phase}` });
    }
    if (point.event) marks.push({ index, kind: "event", tone: EVENT_TONES[point.event] });
    return marks;
  });
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
  const { goal } = currentPhase(state, content);
  return hand.map((card) => {
    // The engine is pure, so playing the card on a copy gives exactly what the play will do.
    const next = playCard(state, content, card.id);
    const delta = next.lastTurn?.delta ?? { users: 0, money: 0 };
    return {
      id: card.id,
      type: card.type,
      title: card.title,
      body: card.body,
      flavor: flavorOf(card),
      effects: forecastEffects(delta),
      forecast: {
        users: goal.users <= 0 ? 1 : Math.max(0, next.users) / goal.users,
        revenue: goal.money <= 0 ? 1 : Math.max(0, next.money) / goal.money,
      },
      forecastText: {
        users: formatScoreDelta("users", delta.users) || "±0",
        revenue: formatScoreDelta("money", delta.money) || "±0",
      },
    };
  });
}

/**
 * A card's effect on the two lines as the card face shows it (score-redesign D15): Geld and
 * Gebruikers with the absolute change, passive costs included, so the face says what the play
 * does to the chart. Reputation stays hidden.
 */
function forecastEffects(delta: Record<ScoreKey, number>): CardEffectView[] {
  const rows: Array<[MeterKey, ScoreKey]> = [
    ["revenue", "money"],
    ["users", "users"],
  ];
  return rows
    .filter(([, score]) => delta[score] !== 0)
    .map(([meter, score]) => ({
      meter,
      delta: delta[score],
      amountText: formatScore(score, Math.abs(delta[score])),
    }));
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
  return {
    id: event.id,
    title: event.title,
    body: event.body,
    options: seededOrder(event.options, `${state.seed}:${event.id}`).map((option) => ({
      id: option.id,
      kind: option.kind,
      label: option.label,
      // Like the draft: what choosing it does, in absolute amounts, the scandal fine included.
      effects: forecastEffects(
        resolveEvent(state, content, option.id).lastTurn?.delta ?? { users: 0, money: 0 }
      ),
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
