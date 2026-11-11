import { describe, expect, it } from "vitest";
import type { GameContent } from "@/features/game-engine/types/gameContent.types";
import { SEED_CONTENT } from "./seedContent";
import {
  findTriggeredEvent,
  getGameOver,
  getPhase,
  goalReached,
  scandalChance,
  scheduleNextEvent,
  type PacingSnapshot,
} from "./progression";

const phase1 = getPhase(SEED_CONTENT, 1);
const { scandal, eventPacing: pacing } = SEED_CONTENT.balance;

/** Seed content whose scandal chance is 100 % below the threshold, so rolls always hit. */
const CERTAIN: GameContent = {
  ...SEED_CONTENT,
  balance: { ...SEED_CONTENT.balance, scandal: { ...scandal, maxChance: 1 } },
};

describe("getGameOver", () => {
  it("should return bankrupt when money is below 0", () => {
    expect(getGameOver(-1)).toBe("bankrupt");
  });

  it("should return null when money is 0 or more", () => {
    expect(getGameOver(0)).toBeNull();
    expect(getGameOver(1_000)).toBeNull();
  });
});

describe("goalReached", () => {
  it("should hold when both numbers reach their goal line", () => {
    expect(goalReached(phase1.goal, { users: phase1.goal.users, money: phase1.goal.money })).toBe(
      true
    );
  });

  it("should not hold when only one number reaches its line", () => {
    expect(goalReached(phase1.goal, { users: phase1.goal.users, money: 0 })).toBe(false);
    expect(goalReached(phase1.goal, { users: 0, money: phase1.goal.money })).toBe(false);
  });
});

describe("scandalChance", () => {
  it("should be 0 when reputation is at or above the threshold", () => {
    expect(scandalChance(scandal.threshold, scandal)).toBe(0);
    expect(scandalChance(100, scandal)).toBe(0);
  });

  it("should rise linearly below the threshold when reputation falls", () => {
    const halfway = scandal.threshold - scandal.rampPoints / 2;
    expect(scandalChance(halfway, scandal)).toBeCloseTo(scandal.maxChance / 2);
    expect(scandalChance(scandal.threshold - 1, scandal)).toBeGreaterThan(0);
  });

  it("should stop at the maximum when reputation is below the ramp", () => {
    expect(scandalChance(scandal.threshold - scandal.rampPoints, scandal)).toBe(scandal.maxChance);
    expect(scandalChance(0, scandal)).toBe(scandal.maxChance);
  });
});

/** Every milestone already fired, so a test sees only scandals (milestones carry over). */
const MILESTONES = SEED_CONTENT.events
  .filter((event) => event.trigger.kind === "milestone")
  .map((event) => event.id);

/** A snapshot with no event yet, safe reputation and the regular gap already open. */
function snapshot(overrides: Partial<PacingSnapshot>): PacingSnapshot {
  return {
    turn: 10,
    phase: 1,
    reputation: 60,
    rngState: 12345,
    firedEventIds: [],
    lastEventTurn: null,
    nextEventTurn: 0,
    ...overrides,
  };
}

/** Just above the end of the ramp: under CERTAIN the chance is ~99.9 %, but not yet the (urgent) maximum. */
const LOW = scandal.threshold - scandal.rampPoints + 0.01;

describe("findTriggeredEvent", () => {
  it("should fire the milestone event when the game is in its phase", () => {
    expect(findTriggeredEvent(SEED_CONTENT, snapshot({ phase: 2 })).event?.id).toBe(
      "event-investeerders"
    );
  });

  it("should carry a milestone into the next phase when pacing held it back in its own", () => {
    expect(findTriggeredEvent(SEED_CONTENT, snapshot({ phase: 3 })).event?.id).toBe(
      "event-investeerders"
    );
  });

  it("should open a scandal before a due milestone when the scandal chance is at its maximum", () => {
    const crisis = snapshot({ phase: 2, reputation: 0 });
    expect(findTriggeredEvent(CERTAIN, crisis).event?.trigger.kind).toBe("scandal");
  });

  it("should still open the due milestone when the scandal chance is below its maximum", () => {
    expect(findTriggeredEvent(CERTAIN, snapshot({ phase: 2, reputation: LOW })).event?.id).toBe(
      "event-investeerders"
    );
  });

  it("should not roll for a scandal or use RNG state when reputation is safe", () => {
    const result = findTriggeredEvent(CERTAIN, snapshot({ phase: 3, firedEventIds: MILESTONES }));
    expect(result.event).toBeNull();
    expect(result.rngState).toBe(12345);
  });

  it("should draw a scandal of the phase when the roll is under the chance", () => {
    const result = findTriggeredEvent(
      CERTAIN,
      snapshot({ phase: 3, reputation: LOW, firedEventIds: MILESTONES })
    );
    expect(result.event?.id).toMatch(/^event-(verkiezingen|eu-boete)$/);
    expect(result.rngState).not.toBe(12345);
  });

  it("should repeat the scandal fired longest ago when every scandal of the phase has fired", () => {
    const fired = [...MILESTONES, "event-eu-boete", "event-verkiezingen"];
    const result = findTriggeredEvent(
      CERTAIN,
      snapshot({ phase: 3, reputation: LOW, firedEventIds: fired })
    );
    expect(result.event?.id).toBe("event-eu-boete");
  });

  it("should hold a scandal back when the seeded gap has not passed and the chance is not at its maximum", () => {
    const held = snapshot({
      phase: 3,
      reputation: LOW,
      firedEventIds: MILESTONES,
      lastEventTurn: 5,
      nextEventTurn: 11,
    });
    expect(findTriggeredEvent(CERTAIN, held).event).toBeNull();
    expect(findTriggeredEvent(CERTAIN, { ...held, turn: 11 }).event).not.toBeNull();
  });

  it("should let a maximum chance skip the random gap but wait the urgent gap", () => {
    const crisis = snapshot({
      phase: 4,
      reputation: 0,
      firedEventIds: MILESTONES,
      lastEventTurn: 10 - pacing.urgentMinTurnsBetween + 1,
      nextEventTurn: 30,
    });
    expect(findTriggeredEvent(CERTAIN, crisis).event).toBeNull();
    expect(findTriggeredEvent(CERTAIN, { ...crisis, turn: 11 }).event?.id).toBe("event-eu-boete");
  });

  it("should never open a second event when one opened on the same turn", () => {
    for (const reputation of [60, LOW, 0]) {
      expect(
        findTriggeredEvent(CERTAIN, snapshot({ phase: 3, reputation, lastEventTurn: 10 })).event
      ).toBeNull();
    }
  });

  it("should give the same result when the snapshot is the same", () => {
    const input = snapshot({ phase: 3, reputation: LOW, firedEventIds: MILESTONES });
    expect(findTriggeredEvent(SEED_CONTENT, input)).toEqual(
      findTriggeredEvent(SEED_CONTENT, input)
    );
  });
});

describe("scheduleNextEvent", () => {
  it("should wait the minimum plus a seeded extra gap when an event opens", () => {
    const gaps = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const next = scheduleNextEvent(pacing, 7, seed);
      expect(next.lastEventTurn).toBe(7);
      const gap = next.nextEventTurn - 7;
      expect(gap).toBeGreaterThanOrEqual(pacing.minTurnsBetween);
      expect(gap).toBeLessThanOrEqual(pacing.minTurnsBetween + pacing.randomExtraTurns);
      gaps.add(gap);
    }
    expect(gaps.size).toBe(pacing.randomExtraTurns + 1);
  });

  it("should give the same gap and RNG state when the RNG state is the same", () => {
    expect(scheduleNextEvent(pacing, 4, 12345)).toEqual(scheduleNextEvent(pacing, 4, 12345));
  });
});
