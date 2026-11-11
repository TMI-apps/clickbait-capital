import type {
  ChartGeometry,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** SVG box of the score chart; the SVG stretches it to its panel (`preserveAspectRatio="none"`). */
export const CHART_WIDTH = 200;
export const CHART_HEIGHT = 80;

/**
 * The history never reaches past this share of the width: the right third stays free for the
 * forecast (chart-timeline D2).
 */
export const HISTORY_WIDTH_SHARE = 2 / 3;

/**
 * Turns the history grows at a fixed step before it reaches `HISTORY_WIDTH_SHARE`; after that the
 * x scale compresses so the whole run fits (chart-timeline D2).
 */
export const FIXED_STEPS = 12;

/** How far right of the newest point the forecast dot sits: halfway into the free right third. */
const FORECAST_GAP = CHART_WIDTH * ((1 - HISTORY_WIDTH_SHARE) / 2);

/**
 * Most points drawn per line. A longer run is thinned to the lowest and highest point per bucket,
 * so peaks and dips stay visible while the path stays short (chart-timeline D4).
 */
export const MAX_DRAWN_POINTS = 160;

/**
 * Where each series' goal line sits, as a share of the chart height from the top. Each series
 * gets its own height, so two goals on one chart never coincide and the colour tells them apart
 * (score-redesign D31).
 */
const GOAL_HEIGHTS = [0.1, 0.3, 0.42];

/**
 * Where each series' lowest visible value sits (share of the height): above the counters laid
 * over the bottom, and apart per series so two lines at their low never cover each other.
 */
const BAND_BOTTOMS = [0.45, 0.55, 0.55];

/**
 * The share that maps to the series' band bottom (`BAND_BOTTOMS`): the lowest visible value with some headroom, so the lines
 * use the whole band between the counters and the goal instead of a thin strip (score-redesign
 * D32). Never above 0.9, so a line on its goal still shows how far it climbed.
 */
function bandFloor(values: readonly number[]): number {
  const lowest = Math.min(0.9, ...values);
  return lowest - Math.max(0.03, (1 - lowest) * 0.08);
}

/**
 * The x of point `index` when the run has `count` points: a fixed step from the left edge until
 * the newest point would pass `HISTORY_WIDTH_SHARE`, then compressed so the whole run fits there.
 */
function timelineX(count: number): (index: number) => number {
  const historyRight = CHART_WIDTH * HISTORY_WIDTH_SHARE;
  const span = Math.max(1, count - 1);
  const step = span <= FIXED_STEPS ? historyRight / FIXED_STEPS : historyRight / span;
  return (index) => index * step;
}

/**
 * Indices to draw for a run of `count` points: all of them up to `MAX_DRAWN_POINTS`, else per
 * bucket the lowest and highest value (in order), plus the first and the newest point.
 */
function drawnIndices(shares: readonly number[]): number[] {
  if (shares.length <= MAX_DRAWN_POINTS) return shares.map((_, index) => index);
  const bucket = Math.ceil(shares.length / (MAX_DRAWN_POINTS / 2));
  const kept = new Set<number>([0, shares.length - 1]);
  for (let start = 0; start < shares.length; start += bucket) {
    let low = start;
    let high = start;
    for (let index = start; index < Math.min(shares.length, start + bucket); index++) {
      if (shares[index]! < shares[low]!) low = index;
      if (shares[index]! > shares[high]!) high = index;
    }
    kept.add(low).add(high);
  }
  return [...kept].sort((a, b) => a - b);
}

/**
 * Chart geometry (score-redesign D10, D31, D32; chart-timeline D1–D4): all series on one chart,
 * each with its own scale so its goal line sits at its own height (`GOAL_HEIGHTS`). The y axis
 * covers the whole run: the lowest value sits just above the counters, a share of 1 on the goal
 * line, and above the goal a line keeps rising toward the top. The x axis is the whole run from
 * turn 0 at the left edge (`timelineX`), so the right third stays free and a forecast never shifts
 * the history. `markers` are point indices (phase starts) drawn as ticks. Pure, so unit-tested.
 */
export function toChartGeometry(
  series: readonly ScoreChartSeries[],
  markers: readonly number[] = []
): ChartGeometry {
  const count = Math.max(1, ...series.map((line) => line.shares.length));
  const x = timelineX(count);
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    markers: markers.filter((index) => index > 0 && index < count).map(x),
    lines: series.map((line, index) => {
      const goalY = CHART_HEIGHT * (GOAL_HEIGHTS[index] ?? GOAL_HEIGHTS[GOAL_HEIGHTS.length - 1]!);
      const bandBottom =
        CHART_HEIGHT * (BAND_BOTTOMS[index] ?? BAND_BOTTOMS[BAND_BOTTOMS.length - 1]!);
      const shares = line.shares.length > 0 ? line.shares : [0];
      const floor = bandFloor(line.forecast === undefined ? shares : [...shares, line.forecast]);
      const perShare = (bandBottom - goalY) / (1 - floor);
      const y = (share: number): number =>
        Math.min(CHART_HEIGHT, Math.max(0, goalY + (1 - share) * perShare));
      const coords = drawnIndices(shares).map((point) => ({ x: x(point), y: y(shares[point]!) }));
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
          : { forecast: { x: last.x + FORECAST_GAP, y: y(line.forecast) } }),
      };
    }),
  };
}
