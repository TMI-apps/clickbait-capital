import { describe, expect, it } from "vitest";
import type { GameState } from "@/features/game-engine/api";
import { SEED_CONTENT, createGame, meterForUsers } from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/api";
import {
  capEffects,
  feedEntryForCard,
  feedEntryForEvent,
  toCardEffects,
  toDraft,
  toEventView,
  toGameEnd,
  toMeters,
  toPhaseProgress,
  toFeed,
} from "@/features/game-board/services/boardView";

const fresh = (): GameState => createGame({ content: SEED_CONTENT, seed: 1 });

describe("boardView", () => {
  it("should list only visible non-zero meter effects in meter order when a card has toxicity", () => {
    expect(toCardEffects({ toxicity: 8, users: 12, revenue: -3, reputation: 0 })).toEqual([
      { meter: "revenue", delta: -3 },
      { meter: "users", delta: 12 },
    ]);
  });

  it("should report zero deltas when there is no previous action", () => {
    expect(toMeters(fresh(), null).map((meter) => meter.delta)).toEqual([0, 0, 0]);
  });

  it("should report the change against the previous meters when there is one", () => {
    const state = { ...fresh(), meters: { revenue: 40, users: 62, reputation: 50 } };
    const deltas = toMeters(state, { revenue: 50, users: 50, reputation: 50 });
    expect(deltas.map((meter) => meter.delta)).toEqual([-10, 12, 0]);
  });

  it("should use the weakest goal condition as progress when the phase has two conditions", () => {
    const state: GameState = {
      ...fresh(),
      phase: 2,
      stats: { users: 2_500_000, revenue: 400_000 },
    };
    const progress = toPhaseProgress(state, SEED_CONTENT);
    expect(progress.phaseName).toBe("De Scale-Up");
    expect(progress.progress).toBeCloseTo(0.5);
    expect(progress.streak).toBeNull();
    const phase2 = SEED_CONTENT.phases[1]!;
    expect(progress.goalStats[0]).toBe(
      `Bereik: 2.500.000 / 5.000.000 (Gebruikers ≥ ${meterForUsers(5_000_000, phase2)})`
    );
    expect(progress.goalStats[1]).toMatch(/^Omzet: €\s?400\.000 \/ €\s?500\.000$/);
  });

  it("should show the turn streak when the goal needs turns in a row", () => {
    const state: GameState = { ...fresh(), phase: 4, goalStreak: 3 };
    const progress = toPhaseProgress(state, SEED_CONTENT);
    expect(progress.streak).toEqual({ current: 3, required: 10 });
    // Phase 4's goal reads meters only, so no absolute stats are shown.
    expect(progress.goalStats).toEqual([]);
  });

  it("should show the hand's cards in drawn order when a draft is open", () => {
    const state: GameState = { ...fresh(), hand: ["news-klimaat", "ad-gokapp", "ad-crypto"] };
    const draft = toDraft(state, SEED_CONTENT);
    expect(draft.map((card) => card.id)).toEqual(["news-klimaat", "ad-gokapp", "ad-crypto"]);
    expect(draft.map((card) => card.type)).toEqual(["news", "ad", "ad"]);
    expect(draft.some((card) => card.droughtWarning)).toBe(false);
  });

  it("should flag every viral card when Journalistieke Droogte is active", () => {
    const state: GameState = {
      ...fresh(),
      turnsWithoutNews: 5,
      hand: ["viral-ruzie", "ad-gokapp", "viral-livestream"],
    };
    const flagged = toDraft(state, SEED_CONTENT).filter((card) => card.droughtWarning);
    expect(flagged.map((card) => card.id)).toEqual(["viral-ruzie", "viral-livestream"]);
  });

  it("should show phase-scaled effects on draft cards when reputation loss is multiplied", () => {
    // viral-ruzie: reputation −2 raw; phase 3 doubles reputation loss.
    const state: GameState = {
      ...fresh(),
      phase: 3,
      hand: ["ad-gokapp", "viral-ruzie", "news-klimaat"],
    };
    const viral = toDraft(state, SEED_CONTENT).find((card) => card.type === "viral");
    expect(viral?.effects).toContainEqual({ meter: "reputation", delta: -4 });
  });

  it("should show phase-scaled effects on event options when the phase halves revenue gains", () => {
    const state: GameState = {
      ...fresh(),
      status: "event",
      pendingEventId: "event-investeerders",
    };
    const commercial = toEventView(state, SEED_CONTENT)?.options.find(
      (option) => option.kind === "commercial"
    );
    // Phase 1 halves positive revenue (+15 raw); users loss is not scaled.
    expect(commercial?.effects).toEqual([
      { meter: "revenue", delta: 8 },
      { meter: "users", delta: -5 },
    ]);
  });

  it("should hide the draft and show the event when an event is pending", () => {
    const state: GameState = {
      ...fresh(),
      status: "event",
      pendingEventId: "event-investeerders",
    };
    expect(toDraft(state, SEED_CONTENT)).toEqual([]);
    expect(toEventView(state, SEED_CONTENT)?.options).toHaveLength(3);
  });

  it("should summarise the run when the game is lost by bankruptcy", () => {
    const state: GameState = { ...fresh(), status: "lost", gameOver: "bankrupt" };
    expect(toGameEnd(state, SEED_CONTENT)).toMatchObject({
      outcome: "lost",
      reason: "bankrupt",
      phaseId: 1,
      statTexts: { users: "70.000", revenue: expect.stringMatching(/^€\s0$/) },
    });
    expect(toGameEnd(fresh(), SEED_CONTENT)).toBeNull();
  });

  it("should use the chosen option label as feed text when an event is resolved", () => {
    const event = SEED_CONTENT.events[0];
    const entry = feedEntryForEvent(event, event.options[2].id, 4);
    expect(entry).toMatchObject({
      contentId: event.id,
      type: "event",
      title: event.title,
      body: event.options[2].label,
    });
  });

  it("should show plain text in the feed when a card body marks glossary words", () => {
    const card = { ...SEED_CONTENT.cards[0], body: "Het [[algoritme]] kiest [[bots|bot]]." };
    expect(feedEntryForCard(card, 3).body).toBe("Het algoritme kiest bots.");
  });
});

describe("capEffects", () => {
  it("should split a gain into the part that counts and the wasted rest when it passes 100", () => {
    const meters = { revenue: 96, users: 100, reputation: 40 };
    expect(
      capEffects(
        [
          { meter: "revenue", delta: 12 },
          { meter: "users", delta: 5 },
          { meter: "reputation", delta: -6 },
        ],
        meters
      )
    ).toEqual([
      { meter: "revenue", delta: 4, overflow: 8 },
      { meter: "users", delta: 0, overflow: 5 },
      { meter: "reputation", delta: -6 },
    ]);
  });

  it("should leave gains untouched when the meter has room for them", () => {
    expect(
      capEffects([{ meter: "users", delta: 10 }], { revenue: 50, users: 90, reputation: 50 })
    ).toEqual([{ meter: "users", delta: 10 }]);
  });

  it("should mark the wasted part on draft cards when a meter is full", () => {
    const state: GameState = {
      ...fresh(),
      meters: { revenue: 100, users: 100, reputation: 100 },
    };
    const gains = toDraft(state, SEED_CONTENT).flatMap((card) =>
      card.effects.filter((effect) => (effect.overflow ?? 0) > 0)
    );
    expect(gains.length).toBeGreaterThan(0);
    expect(gains.every((effect) => effect.delta === 0)).toBe(true);
  });

  it("should cap event option gains when the meter is near full", () => {
    const state: GameState = {
      ...createGame({ content: SEED_CONTENT, seed: 1 }),
      status: "event",
      pendingEventId: "event-investeerders",
      meters: { revenue: 97, users: 50, reputation: 50 },
    };
    // Commercial option: revenue +8 after phase 1 scaling; only 3 fit under 100.
    const commercial = toEventView(state, SEED_CONTENT)?.options.find(
      (option) => option.kind === "commercial"
    );
    expect(commercial?.effects).toContainEqual({
      meter: "revenue",
      delta: 3,
      overflow: 5,
    });
  });
});

describe("toEventView option order", () => {
  it("should keep one option order per run and event and not always lead with the money option when events are shown", () => {
    const firstKinds = (seed: number): string[] =>
      GAME_CONTENT.events.map((event) => {
        const state: GameState = {
          ...createGame({ content: GAME_CONTENT, seed }),
          status: "event",
          pendingEventId: event.id,
        };
        return toEventView(state, GAME_CONTENT)?.options[0]?.kind ?? "";
      });
    expect(firstKinds(7)).toEqual(firstKinds(7));
    expect(new Set(firstKinds(7)).size).toBeGreaterThan(1);
    expect(firstKinds(7)).not.toEqual(firstKinds(8));
  });
});

describe("toGameEnd", () => {
  it("should report the run's peak reach when the game ends below it", () => {
    const state: GameState = {
      ...fresh(),
      status: "won",
      stats: { users: 11_400_000, revenue: 900_000 },
      peakUsers: 22_500_000,
    };
    const end = toGameEnd(state, SEED_CONTENT);
    expect(end?.stats.users).toBe(22_500_000);
    expect(end?.statTexts.users).toBe("22.500.000");
  });
});

describe("toFeed", () => {
  it("should list posts newest first with turn-based keys when steps are given", () => {
    const [card] = SEED_CONTENT.cards;
    const [event] = SEED_CONTENT.events;
    const option = event.options[1];

    const feed = toFeed(
      [
        { action: { kind: "card", cardId: card.id }, turn: 1, eventId: null },
        { action: { kind: "option", optionId: option.id }, turn: 2, eventId: event.id },
        { action: { kind: "card", cardId: card.id }, turn: 3, eventId: null },
      ],
      SEED_CONTENT
    );

    expect(feed).toEqual([
      {
        key: `card-3-${card.id}`,
        contentId: card.id,
        type: card.type,
        title: card.title,
        body: card.body,
      },
      {
        key: `event-2-${event.id}`,
        contentId: event.id,
        type: "event",
        title: event.title,
        body: option.label,
        optionKind: option.kind,
      },
      {
        key: `card-1-${card.id}`,
        contentId: card.id,
        type: card.type,
        title: card.title,
        body: card.body,
      },
    ]);
  });
});
