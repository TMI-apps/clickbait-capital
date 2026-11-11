import { describe, expect, it } from "vitest";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  FIXED_STEPS,
  HISTORY_WIDTH_SHARE,
  MAX_DRAWN_POINTS,
  toChartGeometry,
} from "@/features/score-chart/services/scoreChart";

const series = [
  { key: "users", shares: [0.5, 1.1], tone: "text-meter-users", goalText: "100.000" },
  { key: "money", shares: [0.6, 0.7], tone: "text-meter-revenue", goalText: "€ 150.000" },
];

describe("toChartGeometry", () => {
  it("should put every goal line at its own height on one chart", () => {
    const { lines } = toChartGeometry(series);
    expect(lines.map((line) => [line.key, line.goalText])).toEqual([
      ["users", "100.000"],
      ["money", "€ 150.000"],
    ]);
    expect(lines[0]!.goalY).toBeLessThan(lines[1]!.goalY);
    expect(lines[1]!.goalY - lines[0]!.goalY).toBeGreaterThan(CHART_HEIGHT / 10);
  });

  it("should put a line that passed its goal above its goal line and one below it under it", () => {
    const { lines } = toChartGeometry(series);
    expect(lines[0]!.last.y).toBeLessThan(lines[0]!.goalY);
    expect(lines[1]!.last.y).toBeGreaterThan(lines[1]!.goalY);
  });

  it("should put the start of the run on the left edge, below its goal line, when there is no history", () => {
    const { lines } = toChartGeometry([{ ...series[0]!, shares: [] }]);
    expect(lines[0]!.last.x).toBe(0);
    expect(lines[0]!.last.y).toBeGreaterThan(lines[0]!.goalY);
  });

  it("should keep the lowest point above the counters when the line is far below its goal", () => {
    const line = toChartGeometry([{ ...series[0]!, shares: [0.2, 0.3] }]).lines[0]!;
    const ys = line.points.split(" ").map((point) => Number(point.split(",")[1]));
    // Lowest point just above the counters band (bottom ~40%), the climb clearly visible.
    expect(ys[0]!).toBeGreaterThan(CHART_HEIGHT * 0.4);
    expect(ys[0]!).toBeLessThan(CHART_HEIGHT * 0.6);
    expect(ys[0]! - ys[1]!).toBeGreaterThan(CHART_HEIGHT / 40);
  });

  it("should draw the forecast right of the newest point, above it for a gain", () => {
    const { lines } = toChartGeometry([{ ...series[1]!, forecast: 0.9 }]);
    const line = lines[0]!;
    expect(line.forecast!.x).toBeGreaterThan(line.last.x);
    expect(line.forecast!.y).toBeLessThan(line.last.y);
  });

  it("should advance a fixed step per turn from the left edge while the run is short", () => {
    const xsOf = (count: number): number[] => {
      const shares = Array.from({ length: count }, (_, index) => 0.1 + index / 100);
      const line = toChartGeometry([{ ...series[0]!, shares }]).lines[0]!;
      return line.points.split(" ").map((point) => Number(point.split(",")[0]));
    };
    const step = (CHART_WIDTH * HISTORY_WIDTH_SHARE) / FIXED_STEPS;
    expect(xsOf(3)).toEqual([0, step, 2 * step]);
    expect(xsOf(5).slice(0, 3)).toEqual([0, step, 2 * step]);
  });

  it("should compress the whole run into the left two thirds and keep the forecast in the right third when the run is long", () => {
    const shares = Array.from({ length: 40 }, (_, index) => 0.1 + index / 50);
    const line = toChartGeometry([{ ...series[0]!, shares, forecast: 0.95 }]).lines[0]!;
    const xs = line.points.split(" ").map((point) => Number(point.split(",")[0]));
    expect(xs).toHaveLength(40);
    expect(xs[0]).toBe(0);
    expect(line.last.x).toBeCloseTo(CHART_WIDTH * HISTORY_WIDTH_SHARE);
    expect(line.forecast!.x).toBeGreaterThan(CHART_WIDTH * HISTORY_WIDTH_SHARE);
    expect(line.forecast!.x).toBeLessThanOrEqual(CHART_WIDTH);
  });

  it("should thin a very long run but keep its first, newest, lowest and highest points", () => {
    const shares = Array.from({ length: 1_000 }, (_, index) => 0.5 + Math.sin(index / 7) * 0.2);
    shares[500] = 0.01;
    shares[700] = 1.4;
    const line = toChartGeometry([{ ...series[0]!, shares }]).lines[0]!;
    const coords = line.points.split(" ").map((point) => point.split(",").map(Number));
    expect(coords.length).toBeLessThanOrEqual(MAX_DRAWN_POINTS + 2);
    expect(coords[0]![0]).toBe(0);
    expect(line.last.x).toBeCloseTo(CHART_WIDTH * HISTORY_WIDTH_SHARE);
    const xOf = (index: number): number => (index * CHART_WIDTH * HISTORY_WIDTH_SHARE) / 999;
    const xs = coords.map(([x]) => x!);
    expect(xs.some((x) => Math.abs(x - xOf(500)) < 1e-9)).toBe(true);
    expect(xs.some((x) => Math.abs(x - xOf(700)) < 1e-9)).toBe(true);
  });

  it("should place phase ticks at their point and skip the run's first point", () => {
    const shares = Array.from({ length: 6 }, () => 0.5);
    const { markers } = toChartGeometry([{ ...series[0]!, shares }], [0, 3, 9]);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toBeCloseTo((3 * CHART_WIDTH * HISTORY_WIDTH_SHARE) / FIXED_STEPS);
  });

  it("should keep the history in place whether or not a forecast is shown", () => {
    const without = toChartGeometry([series[1]!]).lines[0]!;
    const withForecast = toChartGeometry([{ ...series[1]!, forecast: 0.65 }]).lines[0]!;
    expect(withForecast.last.x).toBe(without.last.x);
    expect(without.forecast).toBeUndefined();
  });
});
