import { describe, expect, it } from "vitest";
import type { GameState } from "@/features/game-engine/api";
import { createGame } from "@/features/game-engine/api";
import { FOLLOWERS, GAME_CONTENT } from "@/features/game-content/api";
import type { SessionState } from "@/features/game-session/api";
import {
  commentContext,
  commentsForSession,
  commentsForStep,
  LEAVE_BELOW_REPUTATION,
  WILD_FROM_TOXICITY,
} from "@/features/follower-comments/services/followerComments";

const content = GAME_CONTENT;

const NO_MODIFIERS = {
  adFatigue: false,
  echoChamber: false,
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
      delta: { users: 3_000, money: 0 },
      modifiers: NO_MODIFIERS,
    },
  };
};

const critics = new Set(FOLLOWERS.filter((follower) => follower.critical).map((f) => f.id));

describe("commentsForStep", () => {
  it("should return null when no action was taken", () => {
    const game = createGame({ content, seed: 1 });
    expect(commentsForStep({ seed: 1, step: 0, game, content })).toBeNull();
  });

  it("should give the same lines when the same run step is replayed", () => {
    const game = afterPlay("viral");
    const first = commentsForStep({ seed: 7, step: 3, game, content });
    const again = commentsForStep({ seed: 7, step: 3, game, content });
    expect(again).toEqual(first);
  });

  it("should react with lines from different followers on the post topic when the chat is calm", () => {
    const game = { ...afterPlay("news"), toxicity: 0 };
    const batch = commentsForStep({ seed: 7, step: 0, game, content });
    expect(batch?.pace).toBe("calm");
    expect(batch?.comments).toHaveLength(2);
    const ids = batch?.comments.map((comment) => comment.followerId) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
    const first = batch?.comments[0];
    const persona = FOLLOWERS.find((follower) => follower.id === first?.followerId);
    expect(persona?.lines.news).toContain(first?.text);
  });

  it("should post four lines with mean lines first when toxicity is high", () => {
    const game = { ...afterPlay("viral"), toxicity: WILD_FROM_TOXICITY + 5 };
    const batch = commentsForStep({ seed: 7, step: 2, game, content });
    expect(batch?.pace).toBe("wild");
    expect(batch?.comments).toHaveLength(4);
    const first = batch?.comments[0];
    const persona = FOLLOWERS.find((follower) => follower.id === first?.followerId);
    expect(persona?.lines.toxic).toContain(first?.text);
  });

  it("should let the critics leave once and keep them quiet when reputation drops very low", () => {
    const base = afterPlay("viral");
    const game = { ...base, reputation: LEAVE_BELOW_REPUTATION - 5 };
    const crossing = commentsForStep({ seed: 7, step: 4, game, content, previousReputation: 40 });
    const left = crossing?.comments.filter((comment) => comment.kind === "leave") ?? [];
    expect(left.map((comment) => comment.followerId).sort()).toEqual([...critics].sort());
    for (let step = 5; step < 20; step += 1) {
      const batch = commentsForStep({ seed: 7, step, game, content, previousReputation: 15 });
      const comments = batch?.comments ?? [];
      expect(comments.some((comment) => comment.kind === "leave")).toBe(false);
      expect(comments.every((message) => !critics.has(message.followerId))).toBe(true);
    }
  });

  it("should vary lines across steps when the run goes on", () => {
    const game = afterPlay("viral");
    const texts = new Set<string>();
    for (let step = 0; step < 12; step += 1) {
      commentsForStep({ seed: 7, step, game, content })?.comments.forEach((c) => texts.add(c.text));
    }
    expect(texts.size).toBeGreaterThan(8);
  });
});

describe("commentContext", () => {
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
    expect(commentContext(game, content)?.topic).toBe("ad");
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
    expect(commentContext(game, content)?.cues).toContain("adFatigue");
  });
});

describe("commentsForSession", () => {
  it("should give every step its own comments from the state after it when the run is replayed", () => {
    const first = afterPlay("ad");
    const second = { ...afterPlay("news"), toxicity: WILD_FROM_TOXICITY + 5 };
    const session: SessionState = {
      game: second,
      previousGame: first,
      steps: [
        { action: { kind: "card", cardId: "a" }, turn: 0, eventId: null, state: first },
        { action: { kind: "card", cardId: "b" }, turn: 1, eventId: null, state: second },
      ],
      replayedStepCount: 2,
    };
    const batches = commentsForSession(session, content);
    expect(batches.map((batch) => batch?.key)).toEqual([1, 2]);
    expect(batches.map((batch) => batch?.pace)).toEqual(["calm", "wild"]);
    expect(batches[0]).toEqual(commentsForStep({ seed: 7, step: 0, game: first, content }));
  });

  it("should let the critics leave on the step that crossed the line when reputation dropped earlier in the run", () => {
    const high = afterPlay("viral");
    const low = { ...high, reputation: LEAVE_BELOW_REPUTATION - 5 };
    const steps = [high, low, low].map((state, turn) => ({
      action: { kind: "card" as const, cardId: "x" },
      turn,
      eventId: null,
      state,
    }));
    const session: SessionState = { game: low, previousGame: low, steps, replayedStepCount: 0 };
    const leaves = commentsForSession(session, content).map(
      (batch) => batch?.comments.filter((comment) => comment.kind === "leave").length
    );
    expect(leaves).toEqual([0, critics.size, 0]);
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
