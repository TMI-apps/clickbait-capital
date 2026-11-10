import { describe, expect, it } from "vitest";
import { CHART_HEIGHT, toChartGeometry } from "@/features/score-chart/services/scoreChart";

const series = [
  { key: "users", shares: [0.5, 1.1], tone: "text-meter-users", goalText: "100.000" },
  { key: "money", shares: [0.6, 0.7], tone: "text-meter-revenue", goalText: "€ 150.000" },
];

describe("toChartGeometry", () => {
  it("should give every line its own goal line in its own lane, top to bottom", () => {
    const { lines } = toChartGeometry(series, 12);
    expect(lines.map((line) => [line.key, line.goalText])).toEqual([
      ["users", "100.000"],
      ["money", "€ 150.000"],
    ]);
    expect(lines[0]!.goalY).toBeLessThan(CHART_HEIGHT / 2);
    expect(lines[1]!.goalY).toBeGreaterThan(CHART_HEIGHT / 2);
    expect(lines[1]!.goalY).toBeLessThan(CHART_HEIGHT);
  });

  it("should put a line that passed its goal above its goal line and one below it under it", () => {
    const { lines } = toChartGeometry(series, 12);
    expect(lines[0]!.last.y).toBeLessThan(lines[0]!.goalY);
    expect(lines[1]!.last.y).toBeGreaterThan(lines[1]!.goalY);
  });

  it("should draw a line at the bottom of its lane when a series has no points yet", () => {
    const { lines } = toChartGeometry([{ ...series[0]!, shares: [] }], 12);
    expect(lines[0]!.last).toEqual({ x: 0, y: CHART_HEIGHT });
  });
});
