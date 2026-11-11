import { describe, expect, it } from "vitest";
import {
  createGame,
  getHandCards,
  getPendingEvent,
  playCard,
  resolveEvent,
  scandalChance,
  type CardType,
  type GameContent,
  type GameState,
} from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/services/gameContent";

/**
 * Balance simulation: scripted strategies play the full deck through the real engine over
 * many seeds. Proves the design's intent (score-redesign: every one-sided strategy goes
 * bankrupt, a balanced one wins the IPO). Numbers are logged so balance changes show up in
 * test output.
 */

const SEEDS = Array.from({ length: 60 }, (_, index) => index * 7919 + 13);
const MAX_STEPS = 400;

type Choice = { kind: "card"; cardId: string } | { kind: "event"; optionId: string };
type Strategy = (state: GameState, content: GameContent) => Choice;

/**
 * A hand holds any mix of types (shuffled-hand D1), so a type strategy plays the first type of
 * its preference order that the hand holds; the rest of the order is its fallback.
 */
function preferring(state: GameState, content: GameContent, order: readonly CardType[]): Choice {
  const cards = getHandCards(state, content)!;
  for (const type of order) {
    const card = cards.find((candidate) => candidate.type === type);
    if (card) {
      return { kind: "card", cardId: card.id };
    }
  }
  return { kind: "card", cardId: cards[0]!.id };
}

/** Viral whenever the hand has one; otherwise an ad, news only when nothing else is left. */
const viralOnly: Strategy = (state, content) =>
  state.status === "event"
    ? { kind: "event", optionId: "b" }
    : preferring(state, content, ["viral", "ad", "news"]);

/** Ads whenever the hand has one; otherwise news, viral only when nothing else is left. */
const adOnly: Strategy = (state, content) =>
  state.status === "event"
    ? { kind: "event", optionId: "a" }
    : preferring(state, content, ["ad", "news", "viral"]);

/** Journalism first; a viral card when users run low or no news is drawn; an ad only when forced. */
const newsHeavy: Strategy = (state, content) => {
  if (state.status === "event") {
    return { kind: "event", optionId: "c" };
  }
  return preferring(
    state,
    content,
    state.users < GAME_CONTENT.balance.startUsers * 0.7
      ? ["viral", "news", "ad"]
      : ["news", "viral", "ad"]
  );
};

function phaseOf(state: GameState, content: GameContent) {
  return content.phases.find((phase) => phase.id === state.phase)!;
}

/** 0–2: how far both numbers are to the phase's goal lines. */
function goalProgress(state: GameState, content: GameContent): { users: number; money: number } {
  const { goal } = phaseOf(state, content);
  return {
    users: Math.min(1, state.users / goal.users),
    money: Math.min(1, Math.max(0, state.money) / goal.money),
  };
}

/** Euros one turn of passive costs takes in the current phase. */
function costPerTurn(state: GameState, content: GameContent): number {
  const phase = phaseOf(state, content);
  return -(phase.passiveCosts.revenue ?? 0) * phase.moneyPerPoint;
}

/** The scandal chance the board shows (visible to every player). */
function visibleChance(state: GameState, content: GameContent): number {
  return scandalChance(state.reputation, content.balance.scandal);
}

/** How a lookahead player weighs a position; the two players differ only in what they can see. */
interface ScoreWeights {
  /** Weight of hidden reputation and toxicity (0 = the player cannot see them). */
  hidden: number;
  /** Weight of the visible scandal chance. */
  chance: number;
}

/** Sees hidden reputation and toxicity: an upper bound for any human. */
const ALL_SEEING: ScoreWeights = { hidden: 1, chance: 300 };

/** Sees only the board: users, money, goals and the scandal chance. */
const BOARD_ONLY: ScoreWeights = { hidden: 0, chance: 600 };

/**
 * Higher is better: progress to the goal lines first, then a money buffer, minus scandal risk.
 * A pending event has not changed the score yet, so scoring a card never peeks at the event.
 */
function scoreState(state: GameState, content: GameContent, weights: ScoreWeights): number {
  if (state.status === "lost") {
    return -100_000;
  }
  if (state.status === "won") {
    return 100_000;
  }
  const progress = goalProgress(state, content);
  const buffer = Math.min(6, state.money / Math.max(1, costPerTurn(state, content)));
  return (
    state.phase * 1_000 +
    (progress.users + progress.money) * 300 +
    Math.min(progress.users, progress.money) * 300 +
    buffer * 25 -
    visibleChance(state, content) * weights.chance +
    weights.hidden * (state.reputation * 2 - state.toxicity)
  );
}

/** One-step lookahead over the open choices, scored with the given weights. */
function lookahead(weights: ScoreWeights): Strategy {
  return (state, content) => {
    if (state.status === "event") {
      const options = getPendingEvent(state, content)?.options ?? [];
      const best = options
        .map((option) => ({
          id: option.id,
          score: scoreState(resolveEvent(state, content, option.id), content, weights),
        }))
        .sort((a, b) => b.score - a.score)[0];
      return { kind: "event", optionId: best?.id ?? "c" };
    }
    const best = state
      .hand!.map((cardId) => ({
        cardId,
        score: scoreState(playCard(state, content, cardId), content, weights),
      }))
      .sort((a, b) => b.score - a.score)[0]!;
    return { kind: "card", cardId: best.cardId };
  };
}

/** A "balanced" player that reads hidden reputation and toxicity. */
const mixed = lookahead(ALL_SEEING);

/** Human-like player: the same lookahead on board-visible information only. */
const humanLike = lookahead(BOARD_ONLY);

/** Ad-Fatigue is shown on the board once it hits; a player who saw it avoids a third ad in four. */
function adIsFresh(state: GameState): boolean {
  return state.playedTypes.slice(-3).filter((type) => type === "ad").length < 2;
}

/** The type a rule-of-thumb player wants this turn (before looking at what the hand holds). */
/** A rule-of-thumb player turns to news once the board's scandal warning reads this chance. */
const RULE_NEWS_FROM_CHANCE = 0.2;

function ruleOfThumbOrder(state: GameState, content: GameContent): CardType[] {
  const order: CardType[] = [];
  if (visibleChance(state, content) >= RULE_NEWS_FROM_CHANCE) {
    order.push("news");
  }
  // While the warning shows a scandal can cost a lot of money, so keep a bigger buffer.
  const bufferTurns = visibleChance(state, content) > 0 ? 12 : 6;
  if (state.money < costPerTurn(state, content) * bufferTurns && adIsFresh(state)) {
    order.push("ad");
  }
  const progress = goalProgress(state, content);
  const lagging: CardType[] =
    progress.users <= progress.money && state.viralStreak < 2 ? ["viral", "ad"] : ["ad", "viral"];
  return [...new Set<CardType>([...order, ...lagging, "news"])];
}

/**
 * Rule-of-thumb player: no lookahead, only the board (reputation is hidden, so only the scandal
 * warning tells it to play news). News once the warning reads 20 %, an ad when money runs low,
 * then the line furthest from its goal. Events: journalism while the warning reads 20 % or more, else the lagging line.
 */
const ruleOfThumb: Strategy = (state, content) => {
  if (state.status === "event") {
    if (visibleChance(state, content) >= RULE_NEWS_FROM_CHANCE) {
      return { kind: "event", optionId: "c" };
    }
    const progress = goalProgress(state, content);
    return { kind: "event", optionId: progress.money < progress.users ? "a" : "b" };
  }
  return preferring(state, content, ruleOfThumbOrder(state, content));
};

/** Plays the rotation's type for this turn, else the next types of the rotation. */
function rotation(order: readonly CardType[]): Strategy {
  return (state, content) => {
    if (state.status === "event") {
      return { kind: "event", optionId: "c" };
    }
    const start = state.turn % order.length;
    return preferring(state, content, [...order.slice(start), ...order.slice(0, start)]);
  };
}

/** The orchestrator's play-test rotation: Viraal, Advertentie, Nieuws, Nieuws, Advertentie. */
const rotateFive = rotation(["viral", "ad", "news", "news", "ad"]);

/** Naive balance: Viraal, Advertentie, Nieuws in turn; events take the journalism option. */
const rotate = rotation(["viral", "ad", "news"]);

interface Run {
  final: GameState;
  /** Card turns played in each phase. */
  phaseTurns: Record<number, number>;
  /** Card turn on which each event opened, in order (event pacing). */
  eventTurns: number[];
}

function applyChoice(state: GameState, content: GameContent, choice: Choice): GameState {
  return choice.kind === "event"
    ? resolveEvent(state, content, choice.optionId)
    : playCard(state, content, choice.cardId);
}

/** Books one step into the run: card turns per phase, users goal on phase entry, event openings. */
function recordStep(
  run: Run,
  step: { before: GameState; after: GameState; choice: Choice; content: GameContent }
): void {
  const { before, after, choice } = step;
  if (choice.kind === "card") {
    run.phaseTurns[before.phase] = (run.phaseTurns[before.phase] ?? 0) + 1;
  }
  // Every step that leaves an event pending opened a new one (one event per resolution).
  if (after.status === "event") {
    run.eventTurns.push(after.turn);
  }
}

function runGame(content: GameContent, strategy: Strategy, seed: number): Run {
  let state = createGame({ content, seed });
  const run: Run = {
    final: state,
    phaseTurns: {},
    eventTurns: state.status === "event" ? [state.turn] : [],
  };
  for (let step = 0; step < MAX_STEPS; step++) {
    if (state.status !== "playing" && state.status !== "event") {
      break;
    }
    const choice = strategy(state, content);
    const after = applyChoice(state, content, choice);
    recordStep(run, { before: state, after, choice, content });
    state = after;
  }
  return { ...run, final: state };
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)] ?? 0;
}

function median(values: number[]): number {
  return percentile(values, 0.5);
}

interface Summary {
  endings: Record<string, number>;
  maxPhase: Record<number, number>;
  medianTurns: number;
  /** 10th and 90th percentile of total turns: the spread a player can expect. */
  turnsP10P90: [number, number];
  /** Median card turns spent in each phase, over the games that played in it. */
  medianPhaseTurns: Record<number, number>;
  /** In how many games each event fired. */
  eventFires: Record<string, number>;
  /** Median scandals per run (scandal events opened, repeats included). */
  medianScandals: number;
  pacing: EventPacing;
}

/** How events are spread over the runs (event-pacing lap). */
interface EventPacing {
  medianEventsPerRun: number;
  /** Share of events that open on the same card turn as the previous event. */
  sameTurnRate: number;
  /** Share of events that open on the same or the next card turn as the previous event. */
  backToBackRate: number;
  /** Median card turns between two events of a run. */
  medianGap: number;
  /** Smallest gap seen between two events of a run. */
  minGap: number;
}

const rate = (count: number, total: number): number =>
  total === 0 ? 0 : Math.round((count / total) * 100) / 100;

/** Events per run and the turn gaps between them, over all runs of one strategy. */
function measurePacing(runs: Run[]): EventPacing {
  const gaps = runs.flatMap(({ eventTurns }) =>
    eventTurns.slice(1).map((turn, index) => turn - eventTurns[index]!)
  );
  return {
    medianEventsPerRun: median(runs.map((run) => run.eventTurns.length)),
    sameTurnRate: rate(gaps.filter((gap) => gap === 0).length, gaps.length),
    backToBackRate: rate(gaps.filter((gap) => gap <= 1).length, gaps.length),
    medianGap: median(gaps),
    minGap: gaps.length === 0 ? 0 : Math.min(...gaps),
  };
}

function countInto(counts: Record<string, number>, key: string | number): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

/** Endings, furthest phase, event fires and goals met on entry, counted over the runs. */
function countOutcomes(runs: Run[]): Pick<Summary, "endings" | "maxPhase" | "eventFires"> {
  const counts = {
    endings: {} as Record<string, number>,
    maxPhase: {} as Record<number, number>,
    eventFires: {} as Record<string, number>,
  };
  for (const { final } of runs) {
    countInto(counts.endings, final.status === "won" ? "won" : (final.gameOver ?? "unfinished"));
    countInto(counts.maxPhase, final.phase);
    new Set(final.firedEventIds).forEach((id) => countInto(counts.eventFires, id));
  }
  return counts;
}

const SCANDAL_IDS = new Set(
  GAME_CONTENT.events.filter((event) => event.trigger.kind === "scandal").map((event) => event.id)
);

function scandalsIn(state: GameState): number {
  return state.firedEventIds.filter((id) => SCANDAL_IDS.has(id)).length;
}

function summarize(strategy: Strategy): Summary {
  const runs = SEEDS.map((seed) => runGame(GAME_CONTENT, strategy, seed));
  const turns = runs.map((run) => run.final.turn);
  const medianPhaseTurns: Record<number, number> = {};
  for (const phase of [1, 2, 3, 4]) {
    const turns = runs.map((run) => run.phaseTurns[phase]).filter((value) => value !== undefined);
    if (turns.length > 0) {
      medianPhaseTurns[phase] = median(turns);
    }
  }
  return {
    ...countOutcomes(runs),
    medianTurns: median(turns),
    turnsP10P90: [percentile(turns, 0.1), percentile(turns, 0.9)],
    medianPhaseTurns,
    medianScandals: median(runs.map((run) => scandalsIn(run.final))),
    pacing: measurePacing(runs),
  };
}

describe("balance simulation", () => {
  const results = {
    viralOnly: summarize(viralOnly),
    adOnly: summarize(adOnly),
    newsHeavy: summarize(newsHeavy),
    mixed: summarize(mixed),
    rotate: summarize(rotate),
    rotateFive: summarize(rotateFive),
    humanLike: summarize(humanLike),
    ruleOfThumb: summarize(ruleOfThumb),
  };
  process.stdout.write(`${JSON.stringify(results)}\n`);

  it("should end every viral-only game in Bankroet when only viral cards are played", () => {
    expect(results.viralOnly.endings).toEqual({ bankrupt: SEEDS.length });
  });

  it("should end every ad-only game in Bankroet when the ads drive the audience away", () => {
    expect(results.adOnly.endings).toEqual({ bankrupt: SEEDS.length });
  });

  it("should end every news-heavy game in Bankroet when ads are never played", () => {
    expect(results.newsHeavy.endings).toEqual({ bankrupt: SEEDS.length });
  });

  it("should bring scandals to a viral-only player when reputation sinks", () => {
    expect(results.viralOnly.medianScandals).toBeGreaterThanOrEqual(1);
  });

  it("should reach phase 3 or later in most games when the player balances all three types", () => {
    for (const summary of [results.mixed, results.rotate]) {
      const late = (summary.maxPhase[3] ?? 0) + (summary.maxPhase[4] ?? 0);
      expect(late).toBeGreaterThanOrEqual(SEEDS.length * 0.8);
    }
  });

  it("should fire every event in some simulated game when strategies vary", () => {
    const fired = new Set(
      Object.values(results).flatMap((summary) => Object.keys(summary.eventFires))
    );
    expect(
      GAME_CONTENT.events.filter((event) => !fired.has(event.id)).map((event) => event.id)
    ).toEqual([]);
  });

  it("should finish a typical run in 25 to 45 turns when a human-like player sees only the board", () => {
    expect(results.humanLike.medianTurns).toBeGreaterThanOrEqual(25);
    expect(results.humanLike.medianTurns).toBeLessThanOrEqual(45);
  });

  it("should let a human-like player win the IPO in most games when they react to visible warnings", () => {
    expect(results.humanLike.endings.won ?? 0).toBeGreaterThanOrEqual(SEEDS.length * 0.5);
  });

  it("should let a rule-of-thumb player win the IPO in most games when they follow the board", () => {
    expect(results.ruleOfThumb.endings.won ?? 0).toBeGreaterThanOrEqual(SEEDS.length * 0.5);
  });

  it("should never open two events on the same or the next card turn when any strategy plays", () => {
    const { urgentMinTurnsBetween } = GAME_CONTENT.balance.eventPacing;
    for (const summary of Object.values(results)) {
      expect(summary.pacing.sameTurnRate).toBe(0);
      expect(summary.pacing.backToBackRate).toBe(0);
      if (summary.pacing.medianEventsPerRun > 1) {
        expect(summary.pacing.minGap).toBeGreaterThanOrEqual(urgentMinTurnsBetween);
      }
    }
  });

  it("should spread events at least three turns apart on median when a human-like player plays", () => {
    for (const summary of [results.humanLike, results.ruleOfThumb, results.mixed]) {
      expect(summary.pacing.medianGap).toBeGreaterThanOrEqual(3);
    }
  });

  it("should let a careful player win the IPO when they watch the hidden values", () => {
    expect(results.mixed.endings.won ?? 0).toBeGreaterThan(0);
  });
});
