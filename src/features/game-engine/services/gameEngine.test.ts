import { describe, expect, it } from "vitest";
import type {
  CardType,
  GameContent,
  PhaseDefinition,
} from "@/features/game-engine/types/gameContent.types";
import type { GameState } from "@/features/game-engine/types/gameState.types";
import {
  createGame,
  getHandCards,
  getPendingEvent,
  playCard,
  resolveEvent,
  scandalFine,
} from "./gameEngine";
import { usersChange } from "./turnEffects";
import { scandalChance } from "./progression";
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

function withPhases(
  content: GameContent,
  patch: (phase: PhaseDefinition) => PhaseDefinition
): GameContent {
  return { ...content, phases: content.phases.map(patch) };
}

/** Every goal line at 0 and no events: each card turn ends a phase, the fourth wins. */
function instantGoals(): GameContent {
  return {
    ...withPhases(SEED_CONTENT, (phase) => ({
      ...phase,
      passiveCosts: {},
      goal: { description: "", users: 0, money: 0 },
    })),
    events: [],
  };
}

/** Seed content where any reputation below the threshold makes a scandal certain. */
function certainScandals(startReputation: number): GameContent {
  return {
    ...SEED_CONTENT,
    balance: {
      ...SEED_CONTENT.balance,
      startReputation,
      scandal: { threshold: 40, rampPoints: 1, maxChance: 1, finePoints: 0 },
    },
  };
}

describe("createGame", () => {
  it("should start in phase 1 with the start users, money and reputation and a hand of three cards", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    const { balance } = SEED_CONTENT;
    expect(state.phase).toBe(1);
    expect(state).toMatchObject({
      users: balance.startUsers,
      money: balance.startMoney,
      reputation: balance.startReputation,
      toxicity: 0,
      peakUsers: balance.startUsers,
    });
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

describe("playCard", () => {
  it("should throw when the card is not in the draft", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(() => playCard(state, SEED_CONTENT, "no-such-card")).toThrow();
  });

  it("should land the card and the passive cost on users and money and count the turn", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      balance: { ...SEED_CONTENT.balance, startUsers: 50_000 },
    };
    const state = createGame({ content, seed: 1 });
    const phase = content.phases[0]!;
    const card = getHandCards(state, content)!.find((candidate) => candidate.type === "news")!;
    const next = playCard(state, content, card.id);
    const usersDelta = usersChange(state.users, card.effects.users!, {
      phase,
      growth: content.balance,
    });
    const moneyDelta = phase.passiveCosts.revenue! * phase.moneyPerPoint;
    expect(next.turn).toBe(1);
    expect(next.users).toBe(state.users + usersDelta);
    expect(next.money).toBe(state.money + moneyDelta);
    expect(next.reputation).toBe(state.reputation + card.effects.reputation!);
    expect(next.lastTurn).toMatchObject({
      source: { kind: "card", cardId: card.id },
      delta: { users: usersDelta, money: moneyDelta },
    });
  });

  it("should pay an ad per current user when the ad is played", () => {
    const content = instantGoals();
    const phase = { ...content.phases[0]!, goal: { description: "", users: 1e12, money: 0 } };
    const withUsers: GameContent = {
      ...content,
      phases: [phase, ...content.phases.slice(1)],
      balance: { ...content.balance, startUsers: 40_000 },
    };
    const state = createGame({ content: withUsers, seed: 1 });
    const ad = getHandCards(state, withUsers)!.find((card) => card.type === "ad");
    if (!ad) return;
    const next = playCard(state, withUsers, ad.id);
    const gain = Math.round(ad.effects.revenue! * phase.revenueGainMultiplier);
    const cost = phase.passiveCosts.revenue! * phase.moneyPerPoint;
    expect(next.lastTurn!.delta.money).toBe(
      Math.round(gain * withUsers.balance.moneyPerUserPerPoint * 40_000 + cost)
    );
  });

  it("should start from 0 users and grow by the fixed users per point when a viral card is played", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(state.users).toBe(0);
    const viral = getHandCards(state, SEED_CONTENT)!.find((card) => card.type === "viral");
    if (!viral) return;
    const next = playCard(state, SEED_CONTENT, viral.id);
    expect(next.users).toBe(viral.effects.users! * SEED_CONTENT.phases[0]!.usersPerPoint);
  });

  it("should keep the highest users of the run when users fall again", () => {
    let state = createGame({ content: SEED_CONTENT, seed: 11 });
    let peak = state.users;
    let fell = false;
    for (let step = 0; step < 60 && state.status !== "lost" && state.status !== "won"; step++) {
      state =
        state.status === "event"
          ? resolveEvent(state, SEED_CONTENT, "a")
          : playCard(
              state,
              SEED_CONTENT,
              cardOfType(state, SEED_CONTENT, step < 2 ? "viral" : "news")
            );
      fell ||= state.users < peak;
      peak = Math.max(peak, state.users);
      expect(state.peakUsers).toBe(peak);
    }
    expect(fell).toBe(true);
  });
});

describe("playCard progression", () => {
  it("should move to phase 2 and open its milestone event when both goal lines are reached", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      phases: SEED_CONTENT.phases.map((phase) =>
        phase.id === 1 ? { ...phase, goal: { description: "", users: 0, money: 1 } } : phase
      ),
    };
    const state = runGame(content, { seed: 3, policy: () => "news", maxSteps: 1 });
    expect(state.phase).toBe(2);
    expect(state.status).toBe("event");
    expect(getPendingEvent(state, content)?.id).toBe("event-investeerders");
  });

  it("should stay in the phase when only the users goal line is reached", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      phases: SEED_CONTENT.phases.map((phase) =>
        phase.id === 1 ? { ...phase, goal: { description: "", users: 1, money: 1e12 } } : phase
      ),
    };
    const state = runGame(content, { seed: 3, policy: () => "viral", maxSteps: 3 });
    expect(state.phase).toBe(1);
  });

  it("should open a scandal from playCard when reputation is below the scandal threshold", () => {
    const content = certainScandals(10);
    const rich: GameContent = {
      ...content,
      balance: { ...content.balance, startMoney: 1e9 },
    };
    let state = createGame({ content: rich, seed: 4 });
    const opened: string[] = [];
    for (let step = 0; step < 12 && state.status !== "lost" && state.status !== "won"; step++) {
      if (state.status === "event") {
        opened.push(state.pendingEventId!);
        state = resolveEvent(state, rich, "b");
      } else {
        state = playCard(state, rich, cardOfType(state, rich, "viral"));
      }
    }
    const scandals = rich.events.filter((event) => event.trigger.kind === "scandal");
    expect(opened.some((id) => scandals.some((event) => event.id === id))).toBe(true);
  });

  it("should never open a scandal when reputation stays at or above the threshold", () => {
    const content = certainScandals(100);
    const state = runGame(content, { seed: 4, policy: () => "news", maxSteps: 30 });
    expect(state.firedEventIds.filter((id) => id === "event-eu-boete")).toEqual([]);
  });
});

describe("resolveEvent", () => {
  it("should apply the option effects, mark the event fired and open a new draft", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      balance: { ...SEED_CONTENT.balance, startMoney: 1_000_000 },
      phases: SEED_CONTENT.phases.map((phase) =>
        phase.id === 1 ? { ...phase, goal: { description: "", users: 0, money: 1 } } : phase
      ),
    };
    const atEvent = runGame(content, { seed: 3, policy: () => "news", maxSteps: 1 });
    const phase2 = content.phases[1]!;
    const resolved = resolveEvent(atEvent, content, "c");
    expect(resolved.status).toBe("playing");
    expect(resolved.hand).not.toBeNull();
    expect(resolved.firedEventIds).toContain("event-investeerders");
    expect(resolved.reputation).toBe(atEvent.reputation + 10);
    expect(resolved.money).toBe(atEvent.money - 10 * phase2.moneyPerPoint);
    expect(resolved.lastTurn?.delta).toEqual({ users: 0, money: -10 * phase2.moneyPerPoint });
    expect(resolved.turn).toBe(atEvent.turn);
  });

  it("should fine a scandal more when the app has more users", () => {
    const scandal = SEED_CONTENT.events.find((event) => event.trigger.kind === "scandal")!;
    const context = { phase: SEED_CONTENT.phases[1]!, balance: SEED_CONTENT.balance };
    const small = scandalFine(scandal, { ...context, users: 0 });
    const big = scandalFine(scandal, { ...context, users: 1_000_000 });
    expect(small).toBe(SEED_CONTENT.balance.scandal.finePoints * context.phase.moneyPerPoint);
    expect(big - small).toBe(
      Math.round(
        SEED_CONTENT.balance.scandal.finePoints *
          SEED_CONTENT.balance.moneyPerUserPerPoint *
          1_000_000
      )
    );
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

  it("should keep playing while users fall and end in Bankroet only once money is below 0", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      balance: { ...SEED_CONTENT.balance, startUsers: 50_000 },
    };
    let state = createGame({ content, seed: 5 });
    let lowest = state.users;
    for (let step = 0; step < 300 && state.status !== "lost"; step++) {
      state =
        state.status === "event"
          ? resolveEvent(state, content, "c")
          : playCard(state, content, cardOfType(state, content, "news"));
      if (state.status !== "lost") lowest = Math.min(lowest, state.users);
    }
    expect(lowest).toBeLessThan(content.balance.startUsers / 2);
    expect(state.status).toBe("lost");
    expect(state.gameOver).toBe("bankrupt");
    expect(state.money).toBeLessThan(0);
  });

  it("should never end the game when reputation reaches 0", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      events: [],
      balance: { ...SEED_CONTENT.balance, startReputation: 0, startMoney: 1e12 },
      phases: SEED_CONTENT.phases.map((phase) => ({
        ...phase,
        goal: { description: "", users: 1e15, money: 1e15 },
      })),
    };
    let state = createGame({ content, seed: 5 });
    let lowest = state.reputation;
    for (let step = 0; step < 30; step++) {
      state = playCard(state, content, cardOfType(state, content, "viral"));
      lowest = Math.min(lowest, state.reputation);
    }
    expect(lowest).toBe(0);
    expect(state.status).toBe("playing");
  });

  it("should win after phase 4 when every goal line is reached", () => {
    const content = instantGoals();
    const state = runGame(content, { seed: 9, policy: cycle });
    expect(state.status).toBe("won");
    expect(state.phase).toBe(4);
    expect(state.turn).toBe(4);
  });
});

interface EventOpening {
  id: string;
  turn: number;
  urgent: boolean;
}

/** Plays a toxic, random-ish run and records each event as it opens, with the phases reached. */
function recordEventOpenings(seed: number): {
  openings: EventOpening[];
  phases: Set<number>;
  lastPhase: number;
} {
  const { scandal } = SEED_CONTENT.balance;
  const policy: Policy = (_state, step) => (["viral", "viral", "ad", "news"] as const)[step % 4]!;
  const openings: EventOpening[] = [];
  const phases = new Set<number>();
  let state = createGame({ content: SEED_CONTENT, seed });
  for (let step = 0; step < 150; step++) {
    phases.add(state.phase);
    if (state.status === "event") {
      const event = getPendingEvent(state, SEED_CONTENT)!;
      const urgent =
        event.trigger.kind === "milestone" ||
        scandalChance(state.reputation, scandal) >= scandal.maxChance;
      openings.push({ id: event.id, turn: state.turn, urgent });
      state = resolveEvent(state, SEED_CONTENT, "b");
    } else if (state.status === "playing" && state.hand) {
      state = playCard(state, SEED_CONTENT, cardOfType(state, SEED_CONTENT, policy(state, step)));
    } else {
      break;
    }
  }
  return { openings, phases, lastPhase: state.phase };
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

  // A milestone of the run's last phase may still wait behind urgent scandals (exponential-growth D3).
  it("should fire the milestone of every phase the run left when pacing holds events back", () => {
    for (const { openings, phases, lastPhase } of runs) {
      const fired = new Set(openings.map((opening) => opening.id));
      for (const event of SEED_CONTENT.events) {
        const { trigger } = event;
        if (
          trigger.kind === "milestone" &&
          phases.has(trigger.phase) &&
          trigger.phase < lastPhase
        ) {
          expect(fired.has(event.id)).toBe(true);
        }
      }
    }
  });

  it("should open the same events on the same turns when the seed and choices are the same", () => {
    expect(recordEventOpenings(77)).toEqual(recordEventOpenings(77));
  });
});
