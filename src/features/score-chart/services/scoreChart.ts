import type {
  ChartGeometry,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** SVG box of the score chart; the SVG stretches it to its panel (`preserveAspectRatio="none"`). */
export const CHART_WIDTH = 200;
export const CHART_HEIGHT = 80;

/**
 * Where each series' goal line sits, as a share of the chart height from the top. Each series
 * gets its own height, so two goals on one chart never coincide and the colour tells them apart
 * (score-redesign D31).
 */
const GOAL_HEIGHTS = [0.12, 0.32, 0.45];

/** The lowest visible value sits here (share of the height): above the counters laid over the bottom. */
const BAND_BOTTOM = 0.68;

/**
 * The share that maps to `BAND_BOTTOM`: the lowest visible value with some headroom, so the lines
 * use the whole band between the counters and the goal instead of a thin strip (score-redesign
 * D32). Never above 0.9, so a line on its goal still shows how far it climbed.
 */
function bandFloor(values: readonly number[]): number {
  const lowest = Math.min(0.9, ...values);
  return lowest - Math.max(0.03, (1 - lowest) * 0.08);
}

/**
 * Chart geometry (score-redesign D10, D31, D32): all series on one chart, each with its own scale
 * so its goal line sits at its own height (`GOAL_HEIGHTS`). The y axis covers the visible range:
 * the lowest shown value sits just above the counters, a share of 1 on the goal line, and above
 * the goal a line keeps rising toward the top. The x axis holds `slots` history points, newest on
 * the right, plus one reserved slot for the forecast, so the chart does not shift when a forecast
 * appears. Pure, so the shape is unit-tested.
 */
export function toChartGeometry(series: readonly ScoreChartSeries[], slots: number): ChartGeometry {
  const x = (index: number): number => (index / Math.max(1, slots)) * CHART_WIDTH;
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    lines: series.map((line, index) => {
      const goalY = CHART_HEIGHT * (GOAL_HEIGHTS[index] ?? GOAL_HEIGHTS[GOAL_HEIGHTS.length - 1]!);
      const shares = line.shares.length > 0 ? line.shares : [0];
      const floor = bandFloor(line.forecast === undefined ? shares : [...shares, line.forecast]);
      const perShare = (CHART_HEIGHT * BAND_BOTTOM - goalY) / (1 - floor);
      const y = (share: number): number =>
        Math.min(CHART_HEIGHT, Math.max(0, goalY + (1 - share) * perShare));
      const coords = shares.map((share, point) => ({ x: x(point), y: y(share) }));
      const last = coords[coords.length - 1]!;
      return {
        key: line.key,
        tone: line.tone,
        goalText: line.goalText,
        goalY,
        points: coords.map((point) => `${point.x},${point.y}`).join(" "),
        last,
        ...(line.forecast === undefined
          ? {}
          : { forecast: { x: x(shares.length), y: y(line.forecast) } }),
      };
    }),
  };
}
