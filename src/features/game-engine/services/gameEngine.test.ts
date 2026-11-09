import { describe, expect, it } from "vitest";
import type {
  CardType,
  GameContent,
  PhaseDefinition,
} from "@/features/game-engine/types/gameContent.types";
import type { GameState } from "@/features/game-engine/types/gameState.types";
import {
  createGame,
  drawHand,
  getHandCards,
  getPendingEvent,
  isJournalismDroughtActive,
  playCard,
  resolveEvent,
} from "./gameEngine";
import { SEED_CONTENT } from "./seedContent";

type Policy = (state: GameState, step: number) => CardType;

/**
 * The hand's card of the wanted type, else its first card: a hand no longer holds one card per
 * type (shuffled-hand D1), so type-based test policies play the closest card they can.
 */
function cardOfType(state: GameState, content: GameContent, type: CardType): string {
  const cards = getHandCards(state, content)!;
  return (cards.find((card) => card.type === type) ?? cards[0]!).id;
}

/** Plays until the game ends or `maxSteps` decisions; events always take the given option. */
function runGame(
  content: GameContent,
  options: { seed: number; policy: Policy; eventOption?: string; maxSteps?: number }
): GameState {
  let state = createGame({ content, seed: options.seed });
  for (let step = 0; step < (options.maxSteps ?? 200); step++) {
    if (state.status === "event") {
      state = resolveEvent(state, content, options.eventOption ?? "c");
    } else if (state.status === "playing" && state.hand) {
      state = playCard(state, content, cardOfType(state, content, options.policy(state, step)));
    } else {
      break;
    }
  }
  return state;
}

const cycle: Policy = (_state, step) => (["viral", "ad", "news"] as const)[step % 3]!;

interface Visited {
  phases: Set<number>;
  events: number;
  lost: number;
}

/** The users stat as the meter shows it: Gebruikers × the phase market (game-engine D1). */
function expectUsersReadOffMeter(state: GameState): void {
  const phase = SEED_CONTENT.phases.find((candidate) => candidate.id === state.phase)!;
  expect(state.stats.users).toBe(Math.round((state.meters.users * phase.usersAtFullMeter) / 100));
  expect(state.stats.users > 0).toBe(state.meters.users > 0);
}

/** Plays one seeded game, checking the users stat in every state and recording what it reached. */
function playCheckingUsersStat(policy: Policy, visited: Visited): void {
  let state = createGame({ content: SEED_CONTENT, seed: 11 });
  for (
    let step = 0;
    step < 120 && (state.status === "event" || state.status === "playing");
    step++
  ) {
    expectUsersReadOffMeter(state);
    visited.phases.add(state.phase);
    if (state.status === "event") {
      visited.events += 1;
      state = resolveEvent(state, SEED_CONTENT, "b");
    } else {
      state = playCard(state, SEED_CONTENT, cardOfType(state, SEED_CONTENT, policy(state, step)));
    }
  }
  expectUsersReadOffMeter(state);
  visited.lost += state.status === "lost" ? 1 : 0;
}

function withPhases(
  content: GameContent,
  patch: (phase: PhaseDefinition) => PhaseDefinition
): GameContent {
  return { ...content, phases: content.phases.map(patch) };
}

/** Phases 1–3 pass instantly and phase 4 keeps the design IPO goal, so a run reaches the IPO. */
function ipoContent(): GameContent {
  return {
    ...withPhases(SEED_CONTENT, (phase) =>
      phase.id === 4
        ? { ...phase, passiveCosts: {}, reputationLossMultiplier: 1 }
        : {
            ...phase,
            passiveCosts: {},
            goal: { description: "", conditions: [], consecutiveTurns: 1 },
          }
    ),
    events: [],
    cards: [
      { id: "v", type: "viral", title: "", body: "", effects: { users: 10, revenue: -30 } },
      { id: "a", type: "ad", title: "", body: "", effects: { revenue: 20 } },
      { id: "n", type: "news", title: "", body: "", effects: { reputation: 10, toxicity: -10 } },
    ],
  };
}

describe("createGame", () => {
  it("should start in phase 1 with meters at 50, toxicity 0 and a hand of three cards", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(state.phase).toBe(1);
    expect(state.meters).toEqual({ revenue: 50, users: 50, reputation: 50 });
    expect(state.toxicity).toBe(0);
    expect(getHandCards(state, SEED_CONTENT)).toHaveLength(3);
  });

  it("should only draft cards allowed in the current phase", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      cards: SEED_CONTENT.cards.map((card) =>
        card.id === "viral-ruzie" ? { ...card, phases: [3] } : card
      ),
    };
    for (let seed = 0; seed < 20; seed++) {
      expect(createGame({ content, seed }).hand).not.toContain("viral-ruzie");
    }
  });
});

describe("drawHand", () => {
  const SEEDS = Array.from({ length: 200 }, (_, index) => index * 7919 + 13);
  const draws = SEEDS.map((seed) => drawHand(SEED_CONTENT, 1, seed));
  const typesOf = (hand: readonly string[]): string[] =>
    hand.map((id) => SEED_CONTENT.cards.find((card) => card.id === id)!.type);

  it("should draw three different cards of the phase when a hand is drawn", () => {
    for (const { hand } of draws) {
      expect(hand).toHaveLength(3);
      expect(new Set(hand).size).toBe(3);
    }
  });

  it("should mix types freely when many hands are drawn", () => {
    const mixes = draws.map(({ hand }) => typesOf(hand));
    expect(mixes.some((types) => new Set(types).size < 3)).toBe(true);
    expect(mixes.some((types) => new Set(types).size === 3)).toBe(true);
  });

  it("should put any type in any slot when many hands are drawn", () => {
    for (const slot of [0, 1, 2]) {
      const types = new Set(draws.map(({ hand }) => typesOf(hand)[slot]));
      expect([...types].sort()).toEqual(["ad", "news", "viral"]);
    }
  });

  it("should draw the same hand when the seed is the same", () => {
    expect(drawHand(SEED_CONTENT, 2, 42)).toEqual(drawHand(SEED_CONTENT, 2, 42));
  });

  it("should throw when the phase has fewer than three cards", () => {
    const content: GameContent = { ...SEED_CONTENT, cards: SEED_CONTENT.cards.slice(0, 2) };
    expect(() => drawHand(content, 1, 1)).toThrow();
  });
});

describe("playCard", () => {
  it("should throw when the card is not in the draft", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(() => playCard(state, SEED_CONTENT, "no-such-card")).toThrow();
  });

  it("should apply the card, the phase passive cost and count the turn", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    const card = getHandCards(state, SEED_CONTENT)!.find((candidate) => candidate.type === "news")!;
    const next = playCard(state, SEED_CONTENT, card.id);
    expect(next.turn).toBe(1);
    expect(next.meters.revenue).toBe(50 - 1);
    expect(next.meters.reputation).toBe(50 + card.effects.reputation!);
    expect(next.lastTurn?.source).toEqual({ kind: "card", cardId: card.id });
  });

  it("should read the users stat off the Gebruikers meter and the phase market when any action is taken", () => {
    const visited: Visited = { phases: new Set(), events: 0, lost: 0 };
    for (const policy of [cycle, () => "viral", () => "ad", () => "news"] satisfies Policy[]) {
      playCheckingUsersStat(policy, visited);
    }
    expect(visited.phases.size).toBeGreaterThanOrEqual(2);
    expect(visited.events).toBeGreaterThan(0);
    expect(visited.lost).toBeGreaterThan(0);
  });

  it("should keep the highest users stat of the run when the meter falls again", () => {
    let state = createGame({ content: SEED_CONTENT, seed: 11 });
    let peak = state.stats.users;
    let fell = false;
    for (let step = 0; step < 60 && state.status !== "lost" && state.status !== "won"; step++) {
      state =
        state.status === "event"
          ? resolveEvent(state, SEED_CONTENT, "a")
          : playCard(
              state,
              SEED_CONTENT,
              cardOfType(state, SEED_CONTENT, step < 3 ? "viral" : "ad")
            );
      fell ||= state.stats.users < peak;
      peak = Math.max(peak, state.stats.users);
      expect(state.peakUsers).toBe(peak);
    }
    expect(fell).toBe(true);
  });

  it("should move to phase 2 and open its milestone event when 100k users are reached", () => {
    const state = runGame(SEED_CONTENT, { seed: 3, policy: () => "viral", maxSteps: 2 });
    expect(state.stats.users).toBeGreaterThanOrEqual(100_000);
    expect(state.phase).toBe(2);
    expect(state.status).toBe("event");
    expect(getPendingEvent(state, SEED_CONTENT)?.id).toBe("event-investeerders");
  });

  it("should open a toxicity event from playCard when toxicity passes the threshold", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      cards: SEED_CONTENT.cards.map((card) =>
        card.type === "viral" ? { ...card, effects: { users: 1, toxicity: 40 } } : card
      ),
      events: SEED_CONTENT.events.map((event) =>
        event.id === "event-eu-boete"
          ? { ...event, trigger: { kind: "toxicity", threshold: 75 } }
          : event
      ),
    };
    const state = runGame(content, { seed: 4, policy: () => "viral", maxSteps: 2 });
    expect(state.toxicity).toBeGreaterThan(75);
    expect(state.status).toBe("event");
    expect(state.pendingEventId).toBe("event-eu-boete");
  });

  it("should mark the viral card with drought after 5 turns without news", () => {
    const adsThenViral: Policy = (_s, step) => (step < 5 ? "ad" : "viral");
    const afterFour = runGame(SEED_CONTENT, { seed: 3, policy: adsThenViral, maxSteps: 4 });
    expect(isJournalismDroughtActive(afterFour, SEED_CONTENT)).toBe(false);
    const afterFive = runGame(SEED_CONTENT, { seed: 3, policy: adsThenViral, maxSteps: 5 });
    expect(isJournalismDroughtActive(afterFive, SEED_CONTENT)).toBe(true);
    const viralTurn = runGame(SEED_CONTENT, { seed: 3, policy: adsThenViral, maxSteps: 6 });
    expect(viralTurn.lastTurn?.modifiers.journalismDrought).toBe(true);
  });

  it("should reset the IPO streak when a condition breaks in phase 4", () => {
    const content = ipoContent();
    const policy: Policy = (_s, step) => (step === 8 ? "viral" : step % 2 ? "news" : "ad");
    const before = runGame(content, { seed: 9, policy, maxSteps: 8 });
    expect(before.phase).toBe(4);
    expect(before.goalStreak).toBeGreaterThan(0);
    const broken = playCard(before, content, cardOfType(before, content, "viral"));
    expect(broken.meters.revenue).toBeLessThanOrEqual(80);
    expect(broken.goalStreak).toBe(0);
  });
});

describe("resolveEvent", () => {
  it("should apply the option effects, mark the event fired and open a new draft", () => {
    const atEvent = runGame(SEED_CONTENT, { seed: 3, policy: () => "viral", maxSteps: 2 });
    const resolved = resolveEvent(atEvent, SEED_CONTENT, "c");
    expect(resolved.status).toBe("playing");
    expect(resolved.hand).not.toBeNull();
    expect(resolved.firedEventIds).toContain("event-investeerders");
    expect(resolved.meters.reputation).toBe(atEvent.meters.reputation + 10);
    expect(resolved.meters.revenue).toBe(atEvent.meters.revenue - 10);
    expect(resolved.turn).toBe(atEvent.turn);
  });

  it("should throw when no event is pending", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(() => resolveEvent(state, SEED_CONTENT, "a")).toThrow();
  });
});

describe("game engine acceptance", () => {
  it("should replay an identical game when the seed and choices are the same", () => {
    const a = runGame(SEED_CONTENT, { seed: 2026, policy: cycle, maxSteps: 40 });
    const b = runGame(SEED_CONTENT, { seed: 2026, policy: cycle, maxSteps: 40 });
    expect(a).toEqual(b);
    const firstHands = Array.from(
      { length: 10 },
      (_, seed) => createGame({ content: SEED_CONTENT, seed }).hand
    );
    expect(new Set(firstHands.map((hand) => JSON.stringify(hand))).size).toBeGreaterThan(1);
  });

  it("should end with Verlaten Platform when only news is played", () => {
    const state = runGame(SEED_CONTENT, { seed: 5, policy: () => "news" });
    expect(state.status).toBe("lost");
    expect(state.gameOver).toBe("abandoned");
    expect(state.meters.users).toBe(0);
  });

  it("should end with Bankroet when passive costs drain revenue", () => {
    const content = withPhases(SEED_CONTENT, (phase) => ({
      ...phase,
      passiveCosts: { revenue: -10 },
    }));
    const state = runGame(content, { seed: 5, policy: () => "news" });
    expect(state.gameOver).toBe("bankrupt");
    // 50 revenue / 10 per turn; an ad in a hand without news can only delay it.
    expect(state.turn).toBeGreaterThanOrEqual(5);
  });

  it("should end with Verbod & Regulering when reputation decays without news", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      balance: {
        ...SEED_CONTENT.balance,
        reputationDecay: { afterTurnsWithoutNews: 3, amount: 20 },
      },
    };
    const state = runGame(content, { seed: 5, policy: () => "viral", eventOption: "b" });
    expect(state.gameOver).toBe("banned");
    expect(state.meters.reputation).toBe(0);
  });

  it("should win the IPO after 10 consecutive turns with reputation > 60 and revenue > 80", () => {
    const content = ipoContent();
    const state = runGame(content, { seed: 9, policy: (_s, step) => (step % 2 ? "news" : "ad") });
    expect(state.status).toBe("won");
    expect(state.phase).toBe(4);
    expect(state.goalStreak).toBe(10);
    expect(state.meters.reputation).toBeGreaterThan(60);
    expect(state.meters.revenue).toBeGreaterThan(80);
  });
});

interface EventOpening {
  id: string;
  turn: number;
  urgent: boolean;
}

/** Plays a toxic, random-ish run and records each event as it opens, with the phases reached. */
function recordEventOpenings(seed: number): { openings: EventOpening[]; phases: Set<number> } {
  const { crisisToxicity } = SEED_CONTENT.balance.eventPacing;
  const policy: Policy = (_state, step) => (["viral", "viral", "ad", "news"] as const)[step % 4]!;
  const openings: EventOpening[] = [];
  const phases = new Set<number>();
  let state = createGame({ content: SEED_CONTENT, seed });
  for (let step = 0; step < 150; step++) {
    phases.add(state.phase);
    if (state.status === "event") {
      const event = getPendingEvent(state, SEED_CONTENT)!;
      const urgent = event.trigger.kind === "milestone" || state.toxicity >= crisisToxicity;
      openings.push({ id: event.id, turn: state.turn, urgent });
      state = resolveEvent(state, SEED_CONTENT, "b");
    } else if (state.status === "playing" && state.hand) {
      state = playCard(state, SEED_CONTENT, cardOfType(state, SEED_CONTENT, policy(state, step)));
    } else {
      break;
    }
  }
  return { openings, phases };
}

describe("event pacing (game-engine D10)", () => {
  const pacing = SEED_CONTENT.balance.eventPacing;
  const runs = Array.from({ length: 60 }, (_, index) => recordEventOpenings(index * 7919 + 13));

  it("should open at most one event per card turn when several are due", () => {
    for (const { openings } of runs) {
      const turns = openings.map((opening) => opening.turn);
      expect(new Set(turns).size).toBe(turns.length);
    }
  });

  it("should keep the cooldown between events when they open", () => {
    let regularGaps = 0;
    for (const { openings } of runs) {
      openings.slice(1).forEach((opening, index) => {
        const gap = opening.turn - openings[index]!.turn;
        expect(gap).toBeGreaterThanOrEqual(pacing.urgentMinTurnsBetween);
        if (!opening.urgent) {
          regularGaps += 1;
          expect(gap).toBeGreaterThanOrEqual(pacing.minTurnsBetween);
        }
      });
    }
    expect(regularGaps).toBeGreaterThan(0);
  });

  it("should fire the milestone of every phase the run reached when pacing holds events back", () => {
    for (const { openings, phases } of runs) {
      const fired = new Set(openings.map((opening) => opening.id));
      for (const event of SEED_CONTENT.events) {
        if (event.trigger.kind === "milestone" && phases.has(event.trigger.phase)) {
          expect(fired.has(event.id)).toBe(true);
        }
      }
    }
  });

  it("should open the same events on the same turns when the seed and choices are the same", () => {
    expect(recordEventOpenings(77)).toEqual(recordEventOpenings(77));
  });
});
