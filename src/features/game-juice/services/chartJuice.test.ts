import { describe, expect, it } from "vitest";
import {
  CHART_MOVE_TIERS,
  STREAK_LEVELS,
  chartGainVariant,
  chartMoveVariant,
  streakLevel,
  streakStepVariant,
} from "@/features/game-juice/services/chartJuice";

describe("chartJuice", () => {
  it("should name the tier from the line's thresholds when a line moves either way", () => {
    const { users } = CHART_MOVE_TIERS;
    expect(chartMoveVariant("users", users.medium / 2, false)).toBe("up-small");
    expect(chartMoveVariant("users", users.medium, false)).toBe("up-medium");
    expect(chartMoveVariant("users", -users.big, false)).toBe("down-big");
    expect(chartMoveVariant("revenue", CHART_MOVE_TIERS.revenue.huge, false)).toBe("up-huge");
  });

  it("should keep the move dull and fly nothing when news or journalism moved it", () => {
    expect(chartMoveVariant("users", 1, true)).toBe("dull");
    expect(chartGainVariant("users", 1, true)).toBeNull();
  });

  it("should fly a gain to its line by tier and nothing for a loss", () => {
    expect(chartGainVariant("revenue", CHART_MOVE_TIERS.revenue.big, false)).toBe("revenue-big");
    expect(chartGainVariant("users", -0.5, false)).toBeNull();
  });

  it("should start the streak steps at the first level and cap them at the last", () => {
    const [first, second, last] = STREAK_LEVELS;
    expect(streakStepVariant(first - 1)).toBeNull();
    expect(streakStepVariant(first)).toBe(String(first));
    expect(streakStepVariant(last + 4)).toBe(String(last));
    expect([first - 1, first, second, last + 1].map(streakLevel)).toEqual([0, 1, 2, 3]);
  });
});
