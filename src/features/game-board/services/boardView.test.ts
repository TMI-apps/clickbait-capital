import { describe, expect, it } from "vitest";
import type { GameState } from "@/features/game-engine/api";
import { SEED_CONTENT, createGame, playCard, resolveEvent } from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/api";
import {
  feedEntryForCard,
  feedEntryForEvent,
  formatScore,
  streakOf,
  toDraft,
  toEventView,
  toGameEnd,
  toMeters,
  toPhaseProgress,
  toFeed,
  toScandalRisk,
  toScoreHistory,
  toScoreMarkers,
} from "@/features/game-board/services/boardView";

const fresh = (): GameState => createGame({ content: SEED_CONTENT, seed: 1 });

describe("boardView", () => {
  it("should show users and money with zero change when there is no previous action", () => {
    const tiles = toMeters(fresh(), SEED_CONTENT);
    expect(tiles.map((tile) => [tile.key, tile.amount, tile.delta])).toEqual([
      ["users", SEED_CONTENT.balance.startUsers, 0],
      ["revenue", SEED_CONTENT.balance.startMoney, 0],
    ]);
    expect(tiles[0]!.goalText).toBe("Doel: 10.000");
  });

  it("should show the last action's absolute change and the progress to the goal line", () => {
    const state: GameState = {
      ...fresh(),
      users: 7_500,
      money: 4_000,
      lastTurn: {
        source: { kind: "card", cardId: "viral-ruzie" },
        effects: { revenue: -1, users: 15, reputation: -1, toxicity: 14 },
        delta: { users: 2_250, money: -200 },
        modifiers: {
          adFatigue: false,
          echoChamber: false,
          reputationDecay: false,
        },
      },
    };
    const [users, money] = toMeters(state, SEED_CONTENT);
    expect(users).toMatchObject({ value: 75, delta: 2_250, deltaText: "+2.250", full: false });
    expect(money!.deltaText).toMatch(/^−€\s?200$/);
    expect(money!.value).toBe(20);
  });

  it("should mark the goal reached and warn when money is down to a few turns of costs", () => {
    const state: GameState = { ...fresh(), users: 12_000, money: 400 };
    const [users, money] = toMeters(state, SEED_CONTENT);
    expect(users).toMatchObject({ value: 100, full: true });
    expect(money!.danger).toBe(true);
    expect(money!.valueText).toContain("bijna bankroet");
  });

  it("should use the lower goal line as progress and list both lines", () => {
    const { goal } = SEED_CONTENT.phases[1]!;
    const state: GameState = { ...fresh(), phase: 2, users: goal.users, money: goal.money / 4 };
    const progress = toPhaseProgress(state, SEED_CONTENT);
    expect(progress.phaseName).toBe("De Scale-Up");
    expect(progress.progress).toBeCloseTo(0.25);
    expect(progress.goalStats[0]).toBe("Gebruikers: 100.000 / 100.000");
    expect(progress.goalStats[1]).toMatch(/^Geld: €\s?50\.000 \/ €\s?200\.000$/);
  });

  it("should show the scandal chance only while reputation is below the threshold", () => {
    const { threshold, rampPoints, maxChance } = SEED_CONTENT.balance.scandal;
    expect(toScandalRisk({ ...fresh(), reputation: threshold }, SEED_CONTENT)).toBeNull();
    const risk = toScandalRisk({ ...fresh(), reputation: threshold - rampPoints }, SEED_CONTENT);
    expect(risk?.chance).toBe(maxChance);
    expect(risk?.text).toBe(`Schandaal dreigt: ${Math.round(maxChance * 100)}% kans per beurt`);
  });
});

describe("boardView draft and events", () => {
  it("should show the hand's cards in drawn order when a draft is open", () => {
    const state: GameState = { ...fresh(), hand: ["news-klimaat", "ad-gokapp", "ad-crypto"] };
    const draft = toDraft(state, SEED_CONTENT);
    expect(draft.map((card) => card.id)).toEqual(["news-klimaat", "ad-gokapp", "ad-crypto"]);
    expect(draft.map((card) => card.type)).toEqual(["news", "ad", "ad"]);
  });

  it("should forecast exactly where each line lands when the card is played", () => {
    const state: GameState = { ...fresh(), hand: ["news-klimaat", "ad-gokapp", "ad-crypto"] };
    const goal = SEED_CONTENT.phases[0]!.goal;
    for (const card of toDraft(state, SEED_CONTENT)) {
      const next = playCard(state, SEED_CONTENT, card.id);
      expect(card.forecast.users).toBeCloseTo(next.users / goal.users);
      expect(card.forecast.revenue).toBeCloseTo(next.money / goal.money);
      const money = card.effects.find((effect) => effect.meter === "revenue");
      expect(money?.delta ?? 0).toBe(next.lastTurn!.delta.money);
    }
  });

  it("should never show a reputation row on draft cards when a card costs reputation", () => {
    const state: GameState = { ...fresh(), hand: ["ad-gokapp", "viral-ruzie", "news-klimaat"] };
    const effects = toDraft(state, SEED_CONTENT).flatMap((card) => card.effects);
    expect(effects.some((effect) => effect.meter === "reputation")).toBe(false);
  });

  it("should show what each event option does in absolute amounts when an event is pending", () => {
    const state: GameState = {
      ...fresh(),
      status: "event",
      pendingEventId: "event-investeerders",
    };
    for (const option of toEventView(state, SEED_CONTENT)?.options ?? []) {
      const delta = resolveEvent(state, SEED_CONTENT, option.id).lastTurn!.delta;
      const money = option.effects.find((effect) => effect.meter === "revenue");
      expect(money?.delta ?? 0).toBe(delta.money);
      expect(option.effects.every((effect) => effect.amountText !== undefined)).toBe(true);
    }
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
      statTexts: { users: "0", money: expect.stringMatching(/^€\s?3\.000$/) },
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

describe("streakOf", () => {
  it("should count the ups in a row from the newest point when the line rose", () => {
    expect(streakOf([0.1, 0.2, 0.1, 0.2, 0.3, 0.4])).toBe(3);
    expect(streakOf([0.1, 0.2, 0.2])).toBe(0);
    expect(streakOf([0.5])).toBe(0);
  });
});

describe("formatScore", () => {
  it("should put the minus before the euro sign when money is below zero", () => {
    expect(formatScore("money", -24_000)).toMatch(/^−€\s24\.000$/);
    expect(formatScore("money", 150_000)).toMatch(/^€\s150\.000$/);
    expect(formatScore("users", 999_999)).toBe("999.999");
  });

  it("should shorten amounts to millions when they reach a million", () => {
    expect(formatScore("users", 2_000_000)).toBe("2 mln");
    expect(formatScore("users", 12_345_678)).toBe("12,3 mln");
    expect(formatScore("money", -1_250_000)).toMatch(/^−€\s1,3 mln$/);
  });
});

describe("toGameEnd", () => {
  it("should report the run's peak users when the game ends below it", () => {
    const state: GameState = {
      ...fresh(),
      status: "won",
      users: 11_400_000,
      money: 900_000,
      peakUsers: 22_500_000,
    };
    const end = toGameEnd(state, SEED_CONTENT);
    expect(end?.score).toEqual({ users: 22_500_000, money: 900_000 });
    expect(end?.statTexts.users).toBe("22,5 mln");
  });
});

describe("toFeed", () => {
  it("should list posts newest first with turn-based keys when steps are given", () => {
    const [card] = SEED_CONTENT.cards;
    const [event] = SEED_CONTENT.events;
    const option = event.options[1];

    const state = fresh();
    const feed = toFeed(
      [
        { action: { kind: "card", cardId: card.id }, turn: 1, eventId: null, state },
        { action: { kind: "option", optionId: option.id }, turn: 2, eventId: event.id, state },
        { action: { kind: "card", cardId: card.id }, turn: 3, eventId: null, state },
      ],
      SEED_CONTENT
    );

    expect(feed).toEqual([
      {
        key: `card-3-${card.id}`,
        step: 2,
        contentId: card.id,
        type: card.type,
        title: card.title,
        body: card.body,
      },
      {
        key: `event-2-${event.id}`,
        step: 1,
        contentId: event.id,
        type: "event",
        title: event.title,
        body: option.label,
        optionKind: option.kind,
      },
      {
        key: `card-1-${card.id}`,
        step: 0,
        contentId: card.id,
        type: card.type,
        title: card.title,
        body: card.body,
      },
    ]);
  });
});

describe("toScoreHistory", () => {
  it("should start phase 1 at the start values and add the state after every action", () => {
    const start = createGame({ content: SEED_CONTENT, seed: 1 });
    const cardId = start.hand![0]!;
    const after = playCard(start, SEED_CONTENT, cardId);
    const steps = [
      { action: { kind: "card" as const, cardId }, turn: 0, eventId: null, state: after },
    ];
    expect(toScoreHistory(after, steps, SEED_CONTENT)).toEqual([
      { users: SEED_CONTENT.balance.startUsers, money: SEED_CONTENT.balance.startMoney, phase: 1 },
      { users: after.users, money: after.money, phase: after.phase },
    ]);
  });

  it("should keep every point of the run and mark the phase start when a later phase is reached", () => {
    const start = createGame({ content: SEED_CONTENT, seed: 1 });
    const step = (state: typeof start, users: number, phase: typeof start.phase) => ({
      action: { kind: "card" as const, cardId: "x" },
      turn: 0,
      eventId: null,
      state: { ...state, users, phase },
    });
    const steps = Array.from({ length: 20 }, (_, index) =>
      step(start, 1_000 + index, index < 15 ? 1 : 2)
    );
    const history = toScoreHistory(steps[19]!.state, steps, SEED_CONTENT);
    expect(history).toHaveLength(21);
    const [users] = toMeters(steps[19]!.state, SEED_CONTENT, steps);
    expect(users!.history).toHaveLength(21);
    expect(toScoreMarkers(steps[19]!.state, steps, SEED_CONTENT)).toEqual([
      { index: 16, kind: "divider", label: "F2" },
    ]);
  });
});
