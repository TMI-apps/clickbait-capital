import type {
  ChartGeometry,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** SVG box of the score chart; the SVG stretches it to its panel (`preserveAspectRatio="none"`). */
export const CHART_WIDTH = 200;
export const CHART_HEIGHT = 80;

/** Room above the goal line so a line that passed it stays inside the box. */
const MIN_TOP = 1.2;

/** Gap between two lanes, in chart units. */
const LANE_GAP = 6;

/**
 * Chart geometry (score-redesign D10, D30): one lane per series, stacked top to bottom, each with
 * its own scale and its own goal line, so every line visibly races to the goal in its colour and
 * two goals never sit on top of each other. Values are shares of the goal line (1 = on it). The x
 * axis holds `slots` points, newest on the right. Pure, so the shape is unit-tested.
 */
export function toChartGeometry(series: readonly ScoreChartSeries[], slots: number): ChartGeometry {
  const count = Math.max(1, series.length);
  const laneHeight = (CHART_HEIGHT - LANE_GAP * (count - 1)) / count;
  const x = (index: number): number => (index / Math.max(1, slots - 1)) * CHART_WIDTH;
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    lines: series.map((line, lane) => {
      const laneTop = lane * (laneHeight + LANE_GAP);
      const top = Math.max(MIN_TOP, ...line.shares) * 1.05;
      const y = (share: number): number => laneTop + laneHeight - (share / top) * laneHeight;
      const shares = line.shares.length > 0 ? line.shares : [0];
      const coords = shares.map((share, index) => ({ x: x(index), y: y(share) }));
      return {
        key: line.key,
        tone: line.tone,
        goalText: line.goalText,
        goalY: y(1),
        points: coords.map((point) => `${point.x},${point.y}`).join(" "),
        last: coords[coords.length - 1]!,
      };
    }),
  };
}
