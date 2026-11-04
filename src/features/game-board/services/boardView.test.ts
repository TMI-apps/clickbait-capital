import { describe, expect, it } from "vitest";
import type { GameState } from "@/features/game-engine/api";
import { SEED_CONTENT, createGame } from "@/features/game-engine/api";
import {
  capEffects,
  feedEntryForEvent,
  toCardEffects,
  toDraft,
  toEventView,
  toGameEnd,
  toMeters,
  toPhaseProgress,
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
    expect(progress.goalStats[0]).toBe("Bereik: 2.500.000 / 5.000.000");
    expect(progress.goalStats[1]).toMatch(/^Omzet: €\s?400\.000 \/ €\s?500\.000$/);
  });

  it("should show the turn streak when the goal needs turns in a row", () => {
    const state: GameState = { ...fresh(), phase: 4, goalStreak: 3 };
    const progress = toPhaseProgress(state, SEED_CONTENT);
    expect(progress.streak).toEqual({ current: 3, required: 10 });
    // Phase 4's goal reads meters only, so no absolute stats are shown.
    expect(progress.goalStats).toEqual([]);
  });

  it("should give one card per type in viral, ad, news order when a draft is open", () => {
    const draft = toDraft(fresh(), SEED_CONTENT);
    expect(draft.map((card) => card.type)).toEqual(["viral", "ad", "news"]);
    expect(draft.some((card) => card.droughtWarning)).toBe(false);
  });

  it("should flag only the viral card when Journalistieke Droogte is active", () => {
    const state: GameState = { ...fresh(), turnsWithoutNews: 5 };
    const flagged = toDraft(state, SEED_CONTENT).filter((card) => card.droughtWarning);
    expect(flagged.map((card) => card.type)).toEqual(["viral"]);
  });

  it("should show phase-scaled effects on draft cards when reputation loss is multiplied", () => {
    // viral-ruzie: reputation −2 raw; phase 3 doubles reputation loss.
    const state: GameState = {
      ...fresh(),
      phase: 3,
      hand: { viral: "viral-ruzie", ad: "ad-gokapp", news: "news-klimaat" },
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
    const commercial = toEventView(state, SEED_CONTENT)?.options[0];
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
      statTexts: { users: "1.000", revenue: expect.stringMatching(/^€\s0$/) },
    });
    expect(toGameEnd(fresh(), SEED_CONTENT)).toBeNull();
  });

  it("should use the chosen option label as feed text when an event is resolved", () => {
    const event = SEED_CONTENT.events[0];
    const entry = feedEntryForEvent(event, event.options[2].id, 4);
    expect(entry).toMatchObject({
      type: "event",
      title: event.title,
      body: event.options[2].label,
    });
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
});
