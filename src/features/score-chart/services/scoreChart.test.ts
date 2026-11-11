import { describe, expect, it } from "vitest";
import { CHART_HEIGHT, toChartGeometry } from "@/features/score-chart/services/scoreChart";

const series = [
  { key: "users", shares: [0.5, 1.1], tone: "text-meter-users", goalText: "100.000" },
  { key: "money", shares: [0.6, 0.7], tone: "text-meter-revenue", goalText: "€ 150.000" },
];

describe("toChartGeometry", () => {
  it("should put every goal line at its own height on one chart", () => {
    const { lines } = toChartGeometry(series, 12);
    expect(lines.map((line) => [line.key, line.goalText])).toEqual([
      ["users", "100.000"],
      ["money", "€ 150.000"],
    ]);
    expect(lines[0]!.goalY).toBeLessThan(lines[1]!.goalY);
    expect(lines[1]!.goalY - lines[0]!.goalY).toBeGreaterThan(CHART_HEIGHT / 10);
  });

  it("should put a line that passed its goal above its goal line and one below it under it", () => {
    const { lines } = toChartGeometry(series, 12);
    expect(lines[0]!.last.y).toBeLessThan(lines[0]!.goalY);
    expect(lines[1]!.last.y).toBeGreaterThan(lines[1]!.goalY);
  });

  it("should start a series with no points on the left, below its goal line", () => {
    const { lines } = toChartGeometry([{ ...series[0]!, shares: [] }], 12);
    expect(lines[0]!.last.x).toBe(0);
    expect(lines[0]!.last.y).toBeGreaterThan(lines[0]!.goalY);
  });

  it("should keep the lowest point above the counters when the line is far below its goal", () => {
    const line = toChartGeometry([{ ...series[0]!, shares: [0.2, 0.3] }], 12).lines[0]!;
    const ys = line.points.split(" ").map((point) => Number(point.split(",")[1]));
    // Lowest point just above the counters band (bottom ~40%), the climb clearly visible.
    expect(ys[0]!).toBeGreaterThan(CHART_HEIGHT * 0.5);
    expect(ys[0]!).toBeLessThan(CHART_HEIGHT * 0.7);
    expect(ys[0]! - ys[1]!).toBeGreaterThan(CHART_HEIGHT / 20);
  });

  it("should draw the forecast in the slot after the newest point, above it for a gain", () => {
    const { lines } = toChartGeometry([{ ...series[1]!, forecast: 0.9 }], 12);
    const line = lines[0]!;
    expect(line.forecast!.x).toBeGreaterThan(line.last.x);
    expect(line.forecast!.y).toBeLessThan(line.last.y);
  });

  it("should keep the history in place whether or not a forecast is shown", () => {
    const without = toChartGeometry([series[1]!], 12).lines[0]!;
    const withForecast = toChartGeometry([{ ...series[1]!, forecast: 0.65 }], 12).lines[0]!;
    expect(withForecast.last.x).toBe(without.last.x);
    expect(without.forecast).toBeUndefined();
  });
});
