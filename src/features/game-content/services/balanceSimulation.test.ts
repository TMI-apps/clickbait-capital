import { describe, expect, it } from "vitest";
import {
  createGame,
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

type Choice = { kind: "card"; type: CardType } | { kind: "event"; optionId: string };
type Strategy = (state: GameState, content: GameContent) => Choice;

const viralOnly: Strategy = (state) =>
  state.status === "event" ? { kind: "event", optionId: "b" } : { kind: "card", type: "viral" };

const adOnly: Strategy = (state) =>
  state.status === "event" ? { kind: "event", optionId: "a" } : { kind: "card", type: "ad" };

/** Journalism first; a viral card only when users run low; never ads. */
const newsHeavy: Strategy = (state) => {
  if (state.status === "event") {
    return { kind: "event", optionId: "c" };
  }
  return { kind: "card", type: state.meters.users < 35 ? "viral" : "news" };
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
    const hand = state.hand!;
    const best = (["viral", "ad", "news"] as const)
      .map((type) => ({ type, score: scoreState(playCard(state, content, hand[type]), weights) }))
      .sort((a, b) => b.score - a.score)[0]!;
    return { kind: "card", type: best.type };
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

/** The orchestrator's play-test rotation: Viraal, Advertentie, Nieuws, Nieuws, Advertentie. */
const rotateFive: Strategy = (state) => {
  if (state.status === "event") {
    return { kind: "event", optionId: "c" };
  }
  return {
    kind: "card",
    type: (["viral", "ad", "news", "news", "ad"] as const)[state.turn % 5]!,
  };
};

/** Naive balance: Viraal, Advertentie, Nieuws in turn; events take the journalism option. */
const rotate: Strategy = (state) => {
  if (state.status === "event") {
    return { kind: "event", optionId: "c" };
  }
  return { kind: "card", type: (["viral", "ad", "news"] as const)[state.turn % 3]! };
};

interface Run {
  final: GameState;
  /** Card turns played in each phase. */
  phaseTurns: Record<number, number>;
}

function runGame(content: GameContent, strategy: Strategy, seed: number): Run {
  let state = createGame({ content, seed });
  const phaseTurns: Record<number, number> = {};
  for (let step = 0; step < MAX_STEPS; step++) {
    if (state.status !== "playing" && state.status !== "event") {
      break;
    }
    const choice = strategy(state, content);
    if (choice.kind === "card") {
      phaseTurns[state.phase] = (phaseTurns[state.phase] ?? 0) + 1;
    }
    state =
      choice.kind === "event"
        ? resolveEvent(state, content, choice.optionId)
        : playCard(state, content, state.hand![choice.type]);
  }
  return { final: state, phaseTurns };
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
}

function countInto(counts: Record<string, number>, key: string | number): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function summarize(strategy: Strategy): Summary {
  const runs = SEEDS.map((seed) => runGame(GAME_CONTENT, strategy, seed));
  const endings: Record<string, number> = {};
  const maxPhase: Record<number, number> = {};
  const eventFires: Record<string, number> = {};
  for (const { final } of runs) {
    countInto(endings, final.status === "won" ? "won" : (final.gameOver ?? "unfinished"));
    countInto(maxPhase, final.phase);
    final.firedEventIds.forEach((id) => countInto(eventFires, id));
  }
  const turns = runs.map((run) => run.final.turn);
  const medianPhaseTurns: Record<number, number> = {};
  for (const phase of [1, 2, 3, 4]) {
    const turns = runs.map((run) => run.phaseTurns[phase]).filter((value) => value !== undefined);
    if (turns.length > 0) {
      medianPhaseTurns[phase] = median(turns);
    }
  }
  return {
    endings,
    maxPhase,
    medianTurns: median(turns),
    turnsP10P90: [percentile(turns, 0.1), percentile(turns, 0.9)],
    medianPhaseTurns,
    eventFires,
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

  it("should let a careful player win the IPO when they react to every meter", () => {
    expect(results.mixed.endings.won ?? 0).toBeGreaterThan(0);
  });
});
