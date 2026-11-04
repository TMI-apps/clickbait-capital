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
  isJournalismDroughtActive,
  playCard,
  resolveEvent,
} from "./gameEngine";
import { SEED_CONTENT } from "./seedContent";

type Policy = (state: GameState, step: number) => CardType;

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
      state = playCard(state, content, state.hand[options.policy(state, step)]);
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

describe("createGame", () => {
  it("should start in phase 1 with meters at 50, toxicity 0 and one card per type", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(state.phase).toBe(1);
    expect(state.meters).toEqual({ revenue: 50, users: 50, reputation: 50 });
    expect(state.toxicity).toBe(0);
    const hand = getHandCards(state, SEED_CONTENT);
    expect(hand?.viral.type).toBe("viral");
    expect(hand?.ad.type).toBe("ad");
    expect(hand?.news.type).toBe("news");
  });

  it("should only draft cards allowed in the current phase", () => {
    const content: GameContent = {
      ...SEED_CONTENT,
      cards: SEED_CONTENT.cards.map((card) =>
        card.id === "viral-ruzie" ? { ...card, phases: [3] } : card
      ),
    };
    for (let seed = 0; seed < 20; seed++) {
      expect(createGame({ content, seed }).hand?.viral).toBe("viral-livestream");
    }
  });
});

describe("playCard", () => {
  it("should throw when the card is not in the draft", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    expect(() => playCard(state, SEED_CONTENT, "no-such-card")).toThrow();
  });

  it("should apply the card, the phase passive cost and count the turn", () => {
    const state = createGame({ content: SEED_CONTENT, seed: 1 });
    const next = playCard(state, SEED_CONTENT, state.hand!.news);
    const card = SEED_CONTENT.cards.find((c) => c.id === state.hand!.news)!;
    expect(next.turn).toBe(1);
    expect(next.meters.revenue).toBe(50 - 1);
    expect(next.meters.reputation).toBe(50 + card.effects.reputation!);
    expect(next.lastTurn?.source).toEqual({ kind: "card", cardId: card.id });
  });

  it("should move to phase 2 and open its milestone event when 100k users are reached", () => {
    const state = runGame(SEED_CONTENT, { seed: 3, policy: () => "viral", maxSteps: 2 });
    expect(state.stats.users).toBeGreaterThanOrEqual(100_000);
    expect(state.phase).toBe(2);
    expect(state.status).toBe("event");
    expect(getPendingEvent(state, SEED_CONTENT)?.id).toBe("event-investeerders");
  });

  it("should flag journalism drought after 5 turns without news", () => {
    const state = runGame(SEED_CONTENT, {
      seed: 3,
      policy: (_s, step) => (step % 2 ? "ad" : "viral"),
      maxSteps: 6,
      eventOption: "a",
    });
    expect(state.turnsWithoutNews).toBeGreaterThanOrEqual(5);
    expect(isJournalismDroughtActive(state, SEED_CONTENT)).toBe(true);
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
    expect(state.turn).toBe(5);
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
    const content: GameContent = {
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
        { id: "v", type: "viral", title: "", body: "", effects: { users: 10 } },
        { id: "a", type: "ad", title: "", body: "", effects: { revenue: 20 } },
        { id: "n", type: "news", title: "", body: "", effects: { reputation: 10, toxicity: -10 } },
      ],
    };
    const state = runGame(content, { seed: 9, policy: (_s, step) => (step % 2 ? "news" : "ad") });
    expect(state.status).toBe("won");
    expect(state.phase).toBe(4);
    expect(state.goalStreak).toBe(10);
    expect(state.meters.reputation).toBeGreaterThan(60);
    expect(state.meters.revenue).toBeGreaterThan(80);
  });
});
