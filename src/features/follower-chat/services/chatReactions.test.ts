import { describe, expect, it } from "vitest";
import type { GameState } from "@/features/game-engine/api";
import { createGame } from "@/features/game-engine/api";
import { FOLLOWERS, GAME_CONTENT } from "@/features/game-content/api";
import type { SessionState } from "@/features/game-session/api";
import {
  chatContext,
  chatForSession,
  chatForStep,
  LEAVE_BELOW_REPUTATION,
  WILD_FROM_TOXICITY,
} from "@/features/follower-chat/services/chatReactions";

const content = GAME_CONTENT;

const NO_MODIFIERS = {
  adFatigue: false,
  echoChamber: false,
  journalismDrought: false,
  reputationDecay: false,
};

/**
 * A run right after a card of `type` was played: built from the turn report the engine writes,
 * independent of how the hand is drawn.
 */
const afterPlay = (type: "viral" | "ad" | "news", seed = 7): GameState => {
  const card = content.cards.find((candidate) => candidate.type === type);
  if (!card) throw new Error(`no ${type} card`);
  return {
    ...createGame({ content, seed }),
    turn: 1,
    lastTurn: {
      source: { kind: "card", cardId: card.id },
      effects: { revenue: 0, users: 2, reputation: 0, toxicity: 0 },
      modifiers: NO_MODIFIERS,
    },
  };
};

const critics = new Set(FOLLOWERS.filter((follower) => follower.critical).map((f) => f.id));

describe("chatForStep", () => {
  it("should return null when no action was taken", () => {
    const game = createGame({ content, seed: 1 });
    expect(chatForStep({ seed: 1, step: 0, game, content })).toBeNull();
  });

  it("should give the same lines when the same run step is replayed", () => {
    const game = afterPlay("viral");
    const first = chatForStep({ seed: 7, step: 3, game, content });
    const again = chatForStep({ seed: 7, step: 3, game, content });
    expect(again).toEqual(first);
  });

  it("should react with lines from different followers on the post topic when the chat is calm", () => {
    const game = { ...afterPlay("news"), toxicity: 0 };
    const batch = chatForStep({ seed: 7, step: 0, game, content });
    expect(batch?.pace).toBe("calm");
    expect(batch?.messages).toHaveLength(2);
    const ids = batch?.messages.map((message) => message.followerId) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
    const first = batch?.messages[0];
    const persona = FOLLOWERS.find((follower) => follower.id === first?.followerId);
    expect(persona?.lines.news).toContain(first?.text);
  });

  it("should post four lines with mean lines first when toxicity is high", () => {
    const game = { ...afterPlay("viral"), toxicity: WILD_FROM_TOXICITY + 5 };
    const batch = chatForStep({ seed: 7, step: 2, game, content });
    expect(batch?.pace).toBe("wild");
    expect(batch?.messages).toHaveLength(4);
    const first = batch?.messages[0];
    const persona = FOLLOWERS.find((follower) => follower.id === first?.followerId);
    expect(persona?.lines.toxic).toContain(first?.text);
  });

  it("should let a critical follower leave and keep critics quiet when reputation is very low", () => {
    const base = afterPlay("viral");
    const game = { ...base, meters: { ...base.meters, reputation: LEAVE_BELOW_REPUTATION - 5 } };
    for (let step = 0; step < 20; step += 1) {
      const batch = chatForStep({ seed: 7, step, game, content });
      const leave = batch?.messages.filter((message) => message.kind === "leave") ?? [];
      expect(leave).toHaveLength(1);
      expect(critics.has(leave[0].followerId)).toBe(true);
      const talkers = batch?.messages.filter((message) => message.kind === "line") ?? [];
      expect(talkers.every((message) => !critics.has(message.followerId))).toBe(true);
    }
  });

  it("should vary lines across steps when the run goes on", () => {
    const game = afterPlay("viral");
    const texts = new Set<string>();
    for (let step = 0; step < 12; step += 1) {
      chatForStep({ seed: 7, step, game, content })?.messages.forEach((m) => texts.add(m.text));
    }
    expect(texts.size).toBeGreaterThan(8);
  });
});

describe("chatContext", () => {
  it("should read an event option as the card topic it plays like when an event was answered", () => {
    const event = content.events[0];
    const option = event.options.find((candidate) => candidate.kind === "commercial");
    const base = afterPlay("viral");
    const game: GameState = {
      ...base,
      lastTurn: base.lastTurn && {
        ...base.lastTurn,
        source: { kind: "event", eventId: event.id, optionId: option?.id ?? "" },
      },
    };
    expect(chatContext(game, content)?.topic).toBe("ad");
  });

  it("should add the ad-fatigue cue when the turn report has ad fatigue", () => {
    const base = afterPlay("ad");
    const game: GameState = {
      ...base,
      lastTurn: base.lastTurn && {
        ...base.lastTurn,
        modifiers: { ...base.lastTurn.modifiers, adFatigue: true },
      },
    };
    expect(chatContext(game, content)?.cues).toContain("adFatigue");
  });
});

describe("chatForSession", () => {
  it("should stay quiet when the last step was replayed from a save", () => {
    const game = afterPlay("ad");
    const played: SessionState = {
      game,
      previousGame: createGame({ content, seed: 7 }),
      steps: [{ action: { kind: "card", cardId: "any" }, turn: 0, eventId: null }],
      replayedStepCount: 0,
    };
    expect(chatForSession(played, content)?.key).toBe(1);
    expect(chatForSession({ ...played, replayedStepCount: 1 }, content)).toBeNull();
  });
});

describe("FOLLOWERS", () => {
  it("should give every follower lines for all three post topics", () => {
    for (const follower of FOLLOWERS) {
      for (const topic of ["viral", "ad", "news"] as const) {
        expect(follower.lines[topic]?.length ?? 0).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
