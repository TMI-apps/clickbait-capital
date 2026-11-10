import type {
  ChartGeometry,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** SVG box of the score chart; the SVG stretches it to its panel (`preserveAspectRatio="none"`). */
export const CHART_WIDTH = 200;
export const CHART_HEIGHT = 80;

/** Room above the goal line so a line that passed it stays inside the box. */
const MIN_TOP = 1.2;

/**
 * Chart geometry (score-redesign D10): every series as a share of its goal line on one scale,
 * so the dashed goal line is the finish line for all of them. The x axis holds `slots` points,
 * newest on the right. Pure, so the shape is unit-tested.
 */
export function toChartGeometry(series: readonly ScoreChartSeries[], slots: number): ChartGeometry {
  const top = Math.max(MIN_TOP, ...series.flatMap((line) => line.shares)) * 1.05;
  const x = (index: number): number => (index / Math.max(1, slots - 1)) * CHART_WIDTH;
  const y = (share: number): number => CHART_HEIGHT - (share / top) * CHART_HEIGHT;
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    goalY: y(1),
    lines: series.map((line) => {
      const shares = line.shares.length > 0 ? line.shares : [0];
      const coords = shares.map((share, index) => ({ x: x(index), y: y(share) }));
      return {
        key: line.key,
        tone: line.tone,
        points: coords.map((point) => `${point.x},${point.y}`).join(" "),
        last: coords[coords.length - 1]!,
      };
    }),
  };
}
