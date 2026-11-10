import { describe, expect, it } from "vitest";
import { CHART_HEIGHT, toChartGeometry } from "@/features/score-chart/services/scoreChart";

describe("toChartGeometry", () => {
  it("should put a line that passed its goal above the goal line and one below it under it", () => {
    const { goalY, lines } = toChartGeometry(
      [
        { key: "users", shares: [0.5, 1.1], tone: "text-meter-users" },
        { key: "money", shares: [0.6, 0.7], tone: "text-meter-revenue" },
      ],
      12
    );
    expect(goalY).toBeGreaterThan(0);
    expect(goalY).toBeLessThan(CHART_HEIGHT);
    expect(lines.map((line) => line.key)).toEqual(["users", "money"]);
    expect(lines[0]!.last.y).toBeLessThan(goalY);
    expect(lines[1]!.last.y).toBeGreaterThan(goalY);
  });

  it("should draw a flat line at 0 when a series has no points yet", () => {
    const { lines } = toChartGeometry([{ key: "a", shares: [], tone: "" }], 12);
    expect(lines[0]!.last).toEqual({ x: 0, y: CHART_HEIGHT });
  });
});
