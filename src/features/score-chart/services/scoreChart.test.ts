import { describe, expect, it } from "vitest";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  FIXED_STEPS,
  FORECAST_RESERVE_PX,
  MAX_DRAWN_POINTS,
  reserveShare,
  toChartGeometry,
} from "@/features/score-chart/services/scoreChart";
import type { ScoreChartSeries } from "@/features/score-chart/types/scoreChart.types";

const series: ScoreChartSeries[] = [
  { key: "users", shares: [0.5, 1.1], tone: "text-meter-users", goalText: "100.000" },
  { key: "money", shares: [0.6, 0.7], tone: "text-meter-revenue", goalText: "€ 150.000" },
];

const PHONE = 360;
const historyRight = (widthPx = PHONE): number => CHART_WIDTH * (1 - reserveShare(widthPx));
const xsOf = (points: string): number[] =>
  points.split(" ").map((point) => Number(point.split(",")[0]));
const ysOf = (points: string): number[] =>
  points.split(" ").map((point) => Number(point.split(",")[1]));
const ramp = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => 0.1 + index / (count * 1.2));

describe("toChartGeometry", () => {
  it("should put every goal line at its own height on one chart", () => {
    const { lines } = toChartGeometry({ series, widthPx: PHONE });
    expect(lines.map((line) => [line.key, line.goalText])).toEqual([
      ["users", "100.000"],
      ["money", "€ 150.000"],
    ]);
    expect(lines[1]!.goalY - lines[0]!.goalY).toBeGreaterThan(CHART_HEIGHT / 10);
  });

  it("should put a line that passed its goal above its goal line and one below it under it", () => {
    const { lines } = toChartGeometry({ series, widthPx: PHONE });
    expect(lines[0]!.last.y).toBeLessThan(lines[0]!.goalY);
    expect(lines[1]!.last.y).toBeGreaterThan(lines[1]!.goalY);
  });

  it("should put zero on the bottom edge and half the goal halfway between zero and the goal line when the run stays below the goal", () => {
    const line = toChartGeometry({
      series: [{ ...series[0]!, shares: [0, 0.5] }],
      widthPx: PHONE,
    }).lines[0]!;
    const [zero, half] = ysOf(line.points);
    expect(zero!).toBeGreaterThan(CHART_HEIGHT * 0.95);
    expect(half!).toBeCloseTo((zero! + line.goalY) / 2);
  });

  it("should keep a line far above its goal inside the chart by shrinking its scale", () => {
    const line = toChartGeometry({
      series: [{ ...series[0]!, shares: [0.2, 6] }],
      widthPx: PHONE,
    }).lines[0]!;
    expect(line.last.y).toBeGreaterThan(0);
    expect(line.goalY).toBeGreaterThan(CHART_HEIGHT * 0.8);
  });
});

describe("toChartGeometry time axis", () => {
  it("should put the start of the run on the left edge when there is no history", () => {
    const { lines } = toChartGeometry({ series: [{ ...series[0]!, shares: [] }] });
    expect(lines[0]!.last.x).toBe(0);
  });

  it("should keep room for the forecast segment, dot and delta label at every chart width", () => {
    for (const widthPx of [320, 360, 390, 700]) {
      const freePx = reserveShare(widthPx) * widthPx;
      expect(freePx).toBeGreaterThanOrEqual(FORECAST_RESERVE_PX - 1e-9);
    }
    // A wide chart keeps only what the forecast needs (plus the minimum share), not a third.
    expect(reserveShare(1000)).toBeLessThan(0.2);
  });

  it("should draw the forecast right of the newest point with its delta text, above it for a gain", () => {
    const { lines } = toChartGeometry({
      series: [{ ...series[1]!, forecast: 0.9, forecastText: "+€ 30.000" }],
      widthPx: PHONE,
    });
    const line = lines[0]!;
    expect(line.forecast!.x).toBeGreaterThan(line.last.x);
    expect(line.forecast!.y).toBeLessThan(line.last.y);
    expect(line.forecast!.text).toBe("+€ 30.000");
  });

  it("should advance a fixed step per turn from the left edge while the run is short", () => {
    const step = historyRight() / FIXED_STEPS;
    const xs = xsOf(
      toChartGeometry({ series: [{ ...series[0]!, shares: ramp(3) }], widthPx: PHONE }).lines[0]!
        .points
    );
    expect(xs[0]).toBe(0);
    expect(xs[1]).toBeCloseTo(step);
    expect(xs[2]).toBeCloseTo(2 * step);
  });

  it("should compress the whole run left of the free part and keep the forecast in it when the run is long", () => {
    const line = toChartGeometry({
      series: [{ ...series[0]!, shares: ramp(40), forecast: 0.95 }],
      widthPx: PHONE,
    }).lines[0]!;
    const xs = xsOf(line.points);
    expect(xs).toHaveLength(40);
    expect(xs[0]).toBe(0);
    expect(line.last.x).toBeCloseTo(historyRight());
    expect(line.forecast!.x).toBeGreaterThan(historyRight());
    expect(line.forecast!.x).toBeLessThan(CHART_WIDTH);
  });

  it("should thin a very long run but keep its first, newest, lowest and highest points", () => {
    const shares = Array.from({ length: 1_000 }, (_, index) => 0.5 + Math.sin(index / 7) * 0.2);
    shares[500] = 0.01;
    shares[700] = 1.4;
    const line = toChartGeometry({ series: [{ ...series[0]!, shares }], widthPx: PHONE }).lines[0]!;
    const xs = xsOf(line.points);
    expect(xs.length).toBeLessThanOrEqual(MAX_DRAWN_POINTS + 2);
    expect(xs[0]).toBe(0);
    expect(line.last.x).toBeCloseTo(historyRight());
    const xOf = (index: number): number => (index * historyRight()) / 999;
    expect(xs.some((x) => Math.abs(x - xOf(500)) < 1e-9)).toBe(true);
    expect(xs.some((x) => Math.abs(x - xOf(700)) < 1e-9)).toBe(true);
  });

  it("should fade the line before the last phase divider and draw the current phase strong", () => {
    const geometry = toChartGeometry({
      series: [{ ...series[0]!, shares: ramp(10) }],
      markers: [
        { index: 4, kind: "divider", label: "F2" },
        { index: 7, kind: "divider", label: "F3" },
        { index: 5, kind: "event", tone: "text-destructive" },
      ],
      widthPx: PHONE,
    });
    const line = geometry.lines[0]!;
    expect(xsOf(line.pastPoints)).toHaveLength(8);
    expect(xsOf(line.points)).toHaveLength(3);
    // Both parts meet at the divider point, so the line stays continuous.
    const past = xsOf(line.pastPoints);
    expect(past[past.length - 1]).toBe(xsOf(line.points)[0]);
    expect(geometry.markers.map((mark) => [mark.kind, mark.label ?? mark.tone])).toEqual([
      ["divider", "F2"],
      ["divider", "F3"],
      ["event", "text-destructive"],
    ]);
  });

  it("should draw the whole line strong and skip a divider on the first point when the run has no later phase", () => {
    const geometry = toChartGeometry({
      series: [{ ...series[0]!, shares: ramp(5) }],
      markers: [{ index: 0, kind: "divider" }],
    });
    expect(geometry.lines[0]!.pastPoints).toBe("");
    expect(geometry.markers).toEqual([]);
  });

  it("should keep the history in place whether or not a forecast is shown", () => {
    const without = toChartGeometry({ series: [series[1]!] }).lines[0]!;
    const withForecast = toChartGeometry({ series: [{ ...series[1]!, forecast: 0.65 }] }).lines[0]!;
    expect(withForecast.last.x).toBe(without.last.x);
    expect(without.forecast).toBeUndefined();
  });
});
