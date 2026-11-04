import { describe, expect, it } from "vitest";
import type { PhaseGoal } from "@/features/game-engine/types/gameContent.types";
import { SEED_CONTENT } from "./seedContent";
import { findTriggeredEvent, getGameOver, getPhase, goalHolds, updateStats } from "./progression";

const phase1 = getPhase(SEED_CONTENT, 1);
const ipoGoal = getPhase(SEED_CONTENT, 4).goal;

describe("updateStats", () => {
  it("should add users per meter point and gross revenue per positive revenue point", () => {
    const stats = updateStats(
      { users: 1000, revenue: 0 },
      { users: 10, revenue: 4, reputation: 0, toxicity: 0 },
      phase1
    );
    expect(stats).toEqual({
      users: 1000 + 10 * phase1.usersPerPoint,
      revenue: 4 * phase1.revenuePerPoint,
    });
  });

  it("should lower users but never revenue when the deltas are negative", () => {
    const stats = updateStats(
      { users: 20_000, revenue: 9 },
      { users: -2, revenue: -5, reputation: 0, toxicity: 0 },
      phase1
    );
    expect(stats).toEqual({ users: 20_000 - 2 * phase1.usersPerPoint, revenue: 9 });
  });

  it("should not let users fall below 0", () => {
    const stats = updateStats(
      { users: 100, revenue: 0 },
      { users: -50, revenue: 0, reputation: 0, toxicity: 0 },
      phase1
    );
    expect(stats.users).toBe(0);
  });
});

describe("getGameOver", () => {
  it("should return null when every meter is above 0", () => {
    expect(getGameOver({ revenue: 1, users: 1, reputation: 1 })).toBeNull();
  });

  it("should return the matching reason for each meter at 0", () => {
    expect(getGameOver({ revenue: 0, users: 5, reputation: 5 })).toBe("bankrupt");
    expect(getGameOver({ revenue: 5, users: 0, reputation: 5 })).toBe("abandoned");
    expect(getGameOver({ revenue: 5, users: 5, reputation: 0 })).toBe("banned");
  });

  it("should prefer bankrupt, then abandoned when several meters hit 0", () => {
    expect(getGameOver({ revenue: 0, users: 0, reputation: 0 })).toBe("bankrupt");
    expect(getGameOver({ revenue: 3, users: 0, reputation: 0 })).toBe("abandoned");
  });
});

describe("goalHolds", () => {
  const stats = { users: 0, revenue: 0 };

  it("should hold the IPO goal when reputation > 60 and revenue > 80", () => {
    expect(goalHolds(ipoGoal, { meters: { revenue: 81, users: 10, reputation: 61 }, stats })).toBe(
      true
    );
  });

  it("should not hold the IPO goal when a meter equals the bound", () => {
    expect(goalHolds(ipoGoal, { meters: { revenue: 80, users: 10, reputation: 61 }, stats })).toBe(
      false
    );
  });

  it("should hold a stat goal when the stat is at least the value", () => {
    const goal: PhaseGoal = phase1.goal;
    const meters = { revenue: 50, users: 50, reputation: 50 };
    expect(goalHolds(goal, { meters, stats: { users: 100_000, revenue: 0 } })).toBe(true);
    expect(goalHolds(goal, { meters, stats: { users: 99_999, revenue: 0 } })).toBe(false);
  });
});

describe("findTriggeredEvent", () => {
  const none: string[] = [];

  it("should fire the milestone event when the game is in its phase", () => {
    const event = findTriggeredEvent(SEED_CONTENT, { phase: 2, toxicity: 0, firedEventIds: none });
    expect(event?.id).toBe("event-investeerders");
  });

  it("should not fire an event twice", () => {
    const event = findTriggeredEvent(SEED_CONTENT, {
      phase: 2,
      toxicity: 0,
      firedEventIds: ["event-investeerders"],
    });
    expect(event).toBeNull();
  });

  it("should fire a phase-limited toxicity event only above the threshold in that phase", () => {
    expect(
      findTriggeredEvent(SEED_CONTENT, { phase: 3, toxicity: 61, firedEventIds: none })?.id
    ).toBe("event-verkiezingen");
    expect(
      findTriggeredEvent(SEED_CONTENT, { phase: 3, toxicity: 60, firedEventIds: none })
    ).toBeNull();
    expect(
      findTriggeredEvent(SEED_CONTENT, { phase: 1, toxicity: 61, firedEventIds: none })
    ).toBeNull();
  });

  it("should fire the EU fine from phase 2 but not in phase 1 when toxicity is above 75", () => {
    expect(
      findTriggeredEvent(SEED_CONTENT, { phase: 1, toxicity: 76, firedEventIds: none })
    ).toBeNull();
    expect(
      findTriggeredEvent(SEED_CONTENT, { phase: 4, toxicity: 76, firedEventIds: none })?.id
    ).toBe("event-eu-boete");
  });
});
