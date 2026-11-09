import { describe, expect, it } from "vitest";
import {
  createGame,
  getHandCards,
  getPendingEvent,
  playCard,
  resolveEvent,
  type CardType,
  type GameContent,
  type GameState,
} from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/services/gameContent";

/**
 * Balance simulation: scripted strategies play the full deck through the real engine over
 * many seeds. Proves the design's intent (each one-sided strategy fails for its own reason,
 * a balanced one gets far). Numbers are logged so balance changes show up in test output.
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
    state.meters.users < 35 ? ["viral", "news", "ad"] : ["news", "viral", "ad"]
  );
};

/** Turns without news after which a human reacts: reputation decay shows from 3, the drought border at 5. */
const HUMAN_NEWS_REFLEX = 4;

/** How a lookahead player weighs a position; the two players differ only in what they can see. */
interface ScoreWeights {
  goalStreak: number;
  /** Penalty per point of hidden Toxicity (0 = the player cannot see it). */
  toxicity: number;
  /** Penalty once `HUMAN_NEWS_REFLEX` turns passed without news (the visible stand-in for Toxicity). */
  newsDue: number;
}

/** Sees hidden Toxicity: an upper bound for any human. */
const ALL_SEEING: ScoreWeights = { goalStreak: 20, toxicity: 0.4, newsDue: 0 };

/** Sees only the board: meters, stats, phase, goal streak, card and event effects. */
const BOARD_ONLY: ScoreWeights = { goalStreak: 60, toxicity: 0, newsDue: 15 };

/**
 * Higher is better: progress first, then the weakest meter. A pending event has not changed
 * the meters yet, so scoring a card never peeks at the event it triggers.
 */
function scoreState(state: GameState, weights: ScoreWeights): number {
  if (state.status === "lost") {
    return -100_000;
  }
  if (state.status === "won") {
    return 100_000;
  }
  const { revenue, users, reputation } = state.meters;
  const weakest = Math.min(revenue, users, reputation);
  const ipoPush = state.phase === 4 ? Math.min(revenue, 90) + Math.min(reputation, 70) : 0;
  const newsDue = state.turnsWithoutNews >= HUMAN_NEWS_REFLEX ? weights.newsDue : 0;
  return (
    state.phase * 1_000 +
    state.goalStreak * weights.goalStreak +
    Math.log10(state.stats.users + 1) * 40 +
    weakest * 3 +
    (revenue + users + reputation) * 0.5 +
    ipoPush -
    state.toxicity * weights.toxicity -
    newsDue
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
          score: scoreState(resolveEvent(state, content, option.id), weights),
        }))
        .sort((a, b) => b.score - a.score)[0];
      return { kind: "event", optionId: best?.id ?? "c" };
    }
    const best = state
      .hand!.map((cardId) => ({
        cardId,
        score: scoreState(playCard(state, content, cardId), weights),
      }))
      .sort((a, b) => b.score - a.score)[0]!;
    return { kind: "card", cardId: best.cardId };
  };
}

/** A "balanced" player that reads hidden Toxicity. */
const mixed = lookahead(ALL_SEEING);

/**
 * Human-like player: the same lookahead on board-visible information only. Instead of
 * reading Toxicity it follows the visible warnings: news once reputation starts to decay,
 * before the drought border.
 */
const humanLike = lookahead(BOARD_ONLY);

/** The card type that raises each meter, and the event option kind that does. */
const METER_CARD = { revenue: "ad", users: "viral", reputation: "news" } as const;
const METER_OPTION = { revenue: "a", users: "b", reputation: "c" } as const;
type Meter = keyof typeof METER_CARD;

function weakestMeter(state: GameState): [Meter, number] {
  return (Object.entries(state.meters) as [Meter, number][]).sort((a, b) => a[1] - b[1])[0]!;
}

/** Ad-Fatigue is shown on the board once it hits; a player who saw it avoids a third ad in four. */
function adIsFresh(state: GameState): boolean {
  return state.playedTypes.slice(-3).filter((type) => type === "ad").length < 2;
}

/** IPO: Inkomsten above 80 and Reputatie above 60 with a margin, users kept alive. */
function ipoCard(state: GameState): CardType {
  const { revenue, reputation, users } = state.meters;
  if (revenue <= 90 && adIsFresh(state)) {
    return "ad";
  }
  if (reputation <= 75) {
    return "news";
  }
  return users < 50 ? "viral" : "news";
}

/** Phases 1–3: grow users, top up money when it runs low, never three virals in a row. */
function growthCard(state: GameState): CardType {
  const { revenue } = state.meters;
  const moneyFloor = state.phase === 2 ? 60 : state.phase === 3 ? 45 : 0;
  if (revenue < moneyFloor) {
    return adIsFresh(state) ? "ad" : "news";
  }
  if (state.viralStreak < 2) {
    return "viral";
  }
  return revenue < 70 && adIsFresh(state) ? "ad" : "news";
}

/** The wanted type, then the types that raise the meters from weakest to strongest. */
function wantedThenWeakest(state: GameState, wanted: CardType): CardType[] {
  const byNeed = (Object.entries(state.meters) as [Meter, number][])
    .sort((a, b) => a[1] - b[1])
    .map(([meter]) => METER_CARD[meter]);
  return [wanted, ...byNeed.filter((type) => type !== wanted)];
}

/** The type a rule-of-thumb player wants this turn (before looking at what the hand holds). */
function ruleOfThumbType(state: GameState): CardType {
  const [meter, value] = weakestMeter(state);
  if (value < 35) {
    return METER_CARD[meter];
  }
  if (state.turnsWithoutNews >= 3) {
    return "news";
  }
  return state.phase === 4 ? ipoCard(state) : growthCard(state);
}

/**
 * Rule-of-thumb player: no lookahead, only the board. Rescue a meter under 35, news after
 * three turns without it, then play toward the phase goal; without the wanted type, the card
 * for the weakest meter. Events fix the weakest meter. The browser play-test script uses the
 * same rules.
 */
const ruleOfThumb: Strategy = (state, content) => {
  if (state.status === "event") {
    return { kind: "event", optionId: METER_OPTION[weakestMeter(state)[0]] };
  }
  return preferring(state, content, wantedThenWeakest(state, ruleOfThumbType(state)));
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
  /** Phases whose users goal already held on the turn the game entered them. */
  usersGoalMetOnEntry: number[];
  /** Card turn on which each event opened, in order (event pacing). */
  eventTurns: number[];
}

/** True when the phase's users condition (if any) holds in this state. */
function usersGoalHolds(state: GameState, content: GameContent): boolean {
  const phase = content.phases.find((candidate) => candidate.id === state.phase);
  const condition = phase?.goal.conditions.find(
    (candidate) => candidate.kind === "stat" && candidate.stat === "users"
  );
  return condition?.kind === "stat" && state.stats.users >= condition.atLeast;
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
  const { before, after, choice, content } = step;
  if (choice.kind === "card") {
    run.phaseTurns[before.phase] = (run.phaseTurns[before.phase] ?? 0) + 1;
  }
  if (after.phase !== before.phase && usersGoalHolds(after, content)) {
    run.usersGoalMetOnEntry.push(after.phase);
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
    usersGoalMetOnEntry: [],
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
  /** Per phase: in how many games its users goal already held on entry (goal decided by the previous phase). */
  usersGoalMetOnEntry: Record<number, number>;
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
function countOutcomes(
  runs: Run[]
): Pick<Summary, "endings" | "maxPhase" | "eventFires" | "usersGoalMetOnEntry"> {
  const counts = {
    endings: {} as Record<string, number>,
    maxPhase: {} as Record<number, number>,
    eventFires: {} as Record<string, number>,
    usersGoalMetOnEntry: {} as Record<number, number>,
  };
  for (const { final, usersGoalMetOnEntry } of runs) {
    countInto(counts.endings, final.status === "won" ? "won" : (final.gameOver ?? "unfinished"));
    countInto(counts.maxPhase, final.phase);
    final.firedEventIds.forEach((id) => countInto(counts.eventFires, id));
    usersGoalMetOnEntry.forEach((phase) => countInto(counts.usersGoalMetOnEntry, phase));
  }
  return counts;
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

  it("should end every viral-only game in Verbod & Regulering when only viral cards are played", () => {
    expect(results.viralOnly.endings).toEqual({ banned: SEEDS.length });
  });

  it("should end every ad-only game in Verlaten Platform when only ads are played", () => {
    expect(results.adOnly.endings).toEqual({ abandoned: SEEDS.length });
  });

  it("should end every news-heavy game in Bankroet when ads are never played", () => {
    expect(results.newsHeavy.endings).toEqual({ bankrupt: SEEDS.length });
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

  it("should let a careful player win the IPO when they react to every meter", () => {
    expect(results.mixed.endings.won ?? 0).toBeGreaterThan(0);
  });
});
