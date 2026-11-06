import { describe, expect, it } from "vitest";
import type { PhaseGoal } from "@/features/game-engine/types/gameContent.types";
import { SEED_CONTENT } from "./seedContent";
import {
  addGrossRevenue,
  findTriggeredEvent,
  getGameOver,
  getPhase,
  goalHolds,
  meterForUsers,
  scheduleNextEvent,
  usersForMeter,
  type PacingSnapshot,
} from "./progression";

const phase1 = getPhase(SEED_CONTENT, 1);
const ipoGoal = getPhase(SEED_CONTENT, 4).goal;

describe("usersForMeter", () => {
  it("should be the meter's share of the phase market when the meter is between 0 and 100", () => {
    expect(usersForMeter(100, phase1)).toBe(phase1.usersAtFullMeter);
    expect(usersForMeter(50, phase1)).toBe(phase1.usersAtFullMeter / 2);
    expect(usersForMeter(0, phase1)).toBe(0);
  });

  it("should rise with the meter and stay above 0 when the meter is above 0", () => {
    for (let meter = 1; meter <= 100; meter++) {
      expect(usersForMeter(meter, phase1)).toBeGreaterThan(usersForMeter(meter - 1, phase1));
    }
  });
});

describe("meterForUsers", () => {
  it("should return the lowest meter whose users stat reaches the target when asked for a goal", () => {
    for (const phase of SEED_CONTENT.phases) {
      for (const target of [1, 100_000, 5_000_000, 20_000_000]) {
        const meter = meterForUsers(target, phase);
        expect(usersForMeter(meter, phase)).toBeGreaterThanOrEqual(target);
        expect(usersForMeter(meter - 1, phase)).toBeLessThan(target);
      }
    }
  });

  it("should throw when the phase has no positive market", () => {
    expect(() => meterForUsers(1, { ...phase1, usersAtFullMeter: 0 })).toThrow();
  });

  it("should return a level above 100 when the target exceeds the phase market", () => {
    expect(meterForUsers(phase1.usersAtFullMeter + 1, phase1)).toBeGreaterThan(100);
  });
});

describe("addGrossRevenue", () => {
  it("should add gross revenue per positive revenue point when revenue rises", () => {
    const effects = { users: 10, revenue: 4, reputation: 0, toxicity: 0 };
    expect(addGrossRevenue(9, effects, phase1)).toBe(9 + 4 * phase1.revenuePerPoint);
  });

  it("should never lower revenue when the revenue delta is negative", () => {
    expect(addGrossRevenue(9, { users: -2, revenue: -5, reputation: 0, toxicity: 0 }, phase1)).toBe(
      9
    );
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

const pacing = SEED_CONTENT.balance.eventPacing;
/** Every milestone already fired, so a test sees only Toxicity events (milestones carry over). */
const AFTER_MILESTONES = {
  firedEventIds: SEED_CONTENT.events
    .filter((event) => event.trigger.kind === "milestone")
    .map((event) => event.id),
};

/** A snapshot with no event yet and the regular gap already open. */
function snapshot(overrides: Partial<PacingSnapshot>): PacingSnapshot {
  return {
    turn: 10,
    phase: 1,
    toxicity: 0,
    firedEventIds: [],
    lastEventTurn: null,
    nextEventTurn: 0,
    ...overrides,
  };
}

describe("findTriggeredEvent", () => {
  it("should fire the milestone event when the game is in its phase", () => {
    expect(findTriggeredEvent(SEED_CONTENT, snapshot({ phase: 2 }))?.id).toBe(
      "event-investeerders"
    );
  });

  it("should not fire an event twice when it already fired", () => {
    expect(
      findTriggeredEvent(
        SEED_CONTENT,
        snapshot({ phase: 2, firedEventIds: ["event-investeerders"] })
      )
    ).toBeNull();
  });

  it("should fire a phase-limited toxicity event only above the threshold in that phase", () => {
    expect(
      findTriggeredEvent(SEED_CONTENT, snapshot({ ...AFTER_MILESTONES, phase: 3, toxicity: 61 }))
        ?.id
    ).toBe("event-verkiezingen");
    expect(
      findTriggeredEvent(SEED_CONTENT, snapshot({ ...AFTER_MILESTONES, phase: 3, toxicity: 60 }))
    ).toBeNull();
    expect(findTriggeredEvent(SEED_CONTENT, snapshot({ phase: 1, toxicity: 61 }))).toBeNull();
  });

  it("should never open a second event when one opened on the same turn", () => {
    for (const toxicity of [0, 61, 99]) {
      expect(
        findTriggeredEvent(
          SEED_CONTENT,
          snapshot({ ...AFTER_MILESTONES, phase: 3, toxicity, lastEventTurn: 10 })
        )
      ).toBeNull();
    }
  });

  it("should hold a regular toxicity event back when the seeded gap has not passed", () => {
    const held = snapshot({
      ...AFTER_MILESTONES,
      phase: 3,
      toxicity: 61,
      lastEventTurn: 5,
      nextEventTurn: 11,
    });
    expect(findTriggeredEvent(SEED_CONTENT, held)).toBeNull();
    expect(findTriggeredEvent(SEED_CONTENT, { ...held, turn: 11 })?.id).toBe("event-verkiezingen");
  });

  it("should let a crisis skip the random gap but wait the urgent gap when toxicity is at crisis level", () => {
    const crisis = snapshot({
      ...AFTER_MILESTONES,
      phase: 4,
      toxicity: pacing.crisisToxicity + 6,
      lastEventTurn: 10 - pacing.urgentMinTurnsBetween + 1,
      nextEventTurn: 30,
    });
    expect(findTriggeredEvent(SEED_CONTENT, crisis)).toBeNull();
    expect(findTriggeredEvent(SEED_CONTENT, { ...crisis, turn: 10 + 1 })?.id).toBe(
      "event-eu-boete"
    );
  });

  it("should let a milestone skip the random gap but wait the urgent gap when its phase starts", () => {
    const entered = snapshot({ phase: 2, lastEventTurn: 9, nextEventTurn: 30 });
    expect(findTriggeredEvent(SEED_CONTENT, entered)).toBeNull();
    expect(
      findTriggeredEvent(SEED_CONTENT, { ...entered, turn: 9 + pacing.urgentMinTurnsBetween })?.id
    ).toBe("event-investeerders");
  });

  it("should carry a milestone into the next phase when pacing held it back in its own", () => {
    expect(findTriggeredEvent(SEED_CONTENT, snapshot({ phase: 3 }))?.id).toBe(
      "event-investeerders"
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
