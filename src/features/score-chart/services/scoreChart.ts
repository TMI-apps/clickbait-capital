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
 * (score-redesign D31). The bottom part stays free for the counters laid over the chart.
 */
const GOAL_HEIGHTS = [0.18, 0.4, 0.55];

/**
 * Chart geometry (score-redesign D10, D31): all series on one chart, each with its own scale so
 * its goal line sits at its own height (`GOAL_HEIGHTS`). A share of 0 is the bottom of the chart,
 * a share of 1 its goal line; above the goal a line keeps rising toward the top. The x axis holds
 * `slots` points, newest on the right. Pure, so the shape is unit-tested.
 */
export function toChartGeometry(series: readonly ScoreChartSeries[], slots: number): ChartGeometry {
  const x = (index: number): number => (index / Math.max(1, slots - 1)) * CHART_WIDTH;
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    lines: series.map((line, index) => {
      const goalY = CHART_HEIGHT * (GOAL_HEIGHTS[index] ?? GOAL_HEIGHTS[GOAL_HEIGHTS.length - 1]!);
      const y = (share: number): number =>
        Math.max(0, CHART_HEIGHT - share * (CHART_HEIGHT - goalY));
      const shares = line.shares.length > 0 ? line.shares : [0];
      const coords = shares.map((share, point) => ({ x: x(point), y: y(share) }));
      return {
        key: line.key,
        tone: line.tone,
        goalText: line.goalText,
        goalY,
        points: coords.map((point) => `${point.x},${point.y}`).join(" "),
        last: coords[coords.length - 1]!,
      };
    }),
  };
}
