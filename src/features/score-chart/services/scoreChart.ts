import type {
  ChartGeometry,
  ChartGeometryInput,
  ChartLine,
  ChartMarker,
  ChartMarkerMark,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** SVG box of the score chart; the SVG stretches it to its panel (`preserveAspectRatio="none"`). */
export const CHART_WIDTH = 200;
export const CHART_HEIGHT = 80;

/**
 * Room the forecast needs right of the history, in CSS pixels (chart-timeline D5): a short dashed
 * segment (24 px), the hollow dot, and its delta label ("−€ 450.000" at 0.65 rem mono ≈ 70 px).
 */
export const FORECAST_RESERVE_PX = 112;

/** Height of a forecast delta label in CSS pixels: two labels closer than this are spread apart. */
const FORECAST_LABEL_PX = 16;

/** Forecast segment length in CSS pixels: from the newest point to the forecast dot. */
const FORECAST_SEGMENT_PX = 24;

/** The free right part never takes less or more than these shares of the width. */
const RESERVE_SHARE_MIN = 0.18;
const RESERVE_SHARE_MAX = 0.4;

/** Assumed width before the chart is measured (a phone chart). */
const DEFAULT_WIDTH_PX = 360;

/**
 * Turns the history grows at a fixed step before it reaches the free part; after that the x
 * scale compresses so the whole run fits (chart-timeline D2).
 */
export const FIXED_STEPS = 12;

/**
 * Most points drawn per line. A longer run is thinned to the lowest and highest point per bucket,
 * so peaks and dips stay visible while the path stays short (chart-timeline D4).
 */
export const MAX_DRAWN_POINTS = 160;

/**
 * Where each series' goal line sits at the least, as a share of the height from the top
 * (chart-timeline D6): apart per series so the goals never coincide (score-redesign D31). Zero is
 * the bottom edge. `goalTops` pushes them lower when the overlay at the top needs the room.
 */
const GOAL_TOPS = [0.38, 0.54, 0.6];

/** Height of a goal label (0.65 rem text on a 16 px line) plus a little air, in CSS pixels. */
const GOAL_LABEL_PX = 18;

/** No goal line sits lower than this share of the height, however tall the overlay is. */
const GOAL_TOP_MAX = 0.7;

/** Assumed height before the chart is measured (a phone chart). */
const DEFAULT_HEIGHT_PX = 112;

/** Zero sits this far above the bottom edge, so a line at zero keeps its full stroke. */
const ZERO_Y = CHART_HEIGHT - 1.5;

/** A line above its goal never rises past this (chart units from the top), nor into the overlay. */
const TOP_Y = CHART_HEIGHT * 0.04;

/** Air between the top overlay and the highest point, in CSS pixels. */
const OVERLAY_GAP_PX = 6;

/** Share of the width kept free for the forecast at a rendered width (chart-timeline D5). */
export function reserveShare(widthPx: number | undefined): number {
  const width = widthPx && widthPx > 0 ? widthPx : DEFAULT_WIDTH_PX;
  return Math.min(RESERVE_SHARE_MAX, Math.max(RESERVE_SHARE_MIN, FORECAST_RESERVE_PX / width));
}

/**
 * The x of point `index` when the run has `count` points: a fixed step from the left edge until
 * the newest point would pass `historyRight`, then compressed so the whole run fits there.
 */
function timelineX(count: number, historyRight: number): (index: number) => number {
  const span = Math.max(1, count - 1);
  const step = span <= FIXED_STEPS ? historyRight / FIXED_STEPS : historyRight / span;
  return (index) => index * step;
}

/** Lowest and highest index of `shares` in `[start, end)`. */
function bucketExtremes(shares: readonly number[], start: number, end: number): [number, number] {
  let low = start;
  let high = start;
  for (let index = start; index < end; index++) {
    if (shares[index]! < shares[low]!) low = index;
    if (shares[index]! > shares[high]!) high = index;
  }
  return [low, high];
}

/**
 * Indices to draw: all of them up to `MAX_DRAWN_POINTS`, else per bucket the lowest and highest
 * value, plus the first, the newest and every index in `keep` (the divider points).
 */
function drawnIndices(shares: readonly number[], keep: readonly number[]): number[] {
  if (shares.length <= MAX_DRAWN_POINTS) return shares.map((_, index) => index);
  const bucket = Math.ceil(shares.length / (MAX_DRAWN_POINTS / 2));
  const kept = new Set<number>([0, shares.length - 1, ...keep]);
  for (let start = 0; start < shares.length; start += bucket) {
    for (const index of bucketExtremes(shares, start, Math.min(shares.length, start + bucket))) {
      kept.add(index);
    }
  }
  return [...kept].sort((a, b) => a - b);
}

/**
 * The y of a share for one series: zero on the bottom, its goal at `goalTop`; when the run or the
 * forecast rose past what fits above the goal, the scale shrinks so the highest point stays at or
 * below `topY` (under the counters, so no point or forecast hides behind them).
 */
function shareToY(
  values: readonly number[],
  goalTop: number,
  topY: number
): { goalY: number; y: (share: number) => number } {
  const highest = Math.max(1, ...values);
  const perShare = Math.min(ZERO_Y - goalTop, (ZERO_Y - topY) / highest);
  return {
    goalY: ZERO_Y - perShare,
    y: (share) => ZERO_Y - Math.max(0, share) * perShare,
  };
}

/**
 * Each series' goal line in chart units (chart-timeline D6): at least its `GOAL_TOPS` share, and
 * low enough that its label (drawn above the line) clears the overlay at the top and the label of
 * the series before it. Never below `GOAL_TOP_MAX`.
 */
export function goalTops(count: number, heightPx: number, topInsetPx: number): number[] {
  const tops: number[] = [];
  let clear = topInsetPx;
  for (let index = 0; index < count; index++) {
    const share = GOAL_TOPS[index] ?? GOAL_TOPS[GOAL_TOPS.length - 1]!;
    const px = Math.min(GOAL_TOP_MAX * heightPx, Math.max(share * heightPx, clear + GOAL_LABEL_PX));
    tops.push((px / heightPx) * CHART_HEIGHT);
    clear = px;
  }
  return tops;
}

/**
 * Spreads the forecast delta labels apart when two dots sit closer than a label's height: the
 * upper label moves up and the lower one down by half the overlap each (chart-timeline D7).
 */
function spreadForecastLabels(lines: ChartLine[], heightPx: number): ChartLine[] {
  const shown = lines
    .filter((line) => line.forecast?.text)
    .sort((a, b) => a.forecast!.y - b.forecast!.y);
  for (let index = 1; index < shown.length; index++) {
    const upper = shown[index - 1]!.forecast!;
    const lower = shown[index]!.forecast!;
    const gapPx =
      ((lower.y - upper.y) / CHART_HEIGHT) * heightPx + lower.labelShiftPx - upper.labelShiftPx;
    if (gapPx >= FORECAST_LABEL_PX) continue;
    const half = (FORECAST_LABEL_PX - gapPx) / 2;
    upper.labelShiftPx -= half;
    lower.labelShiftPx += half;
  }
  return lines;
}

interface LineContext {
  x: (index: number) => number;
  /** Goal line per series, in chart units (`goalTops`). */
  goalTops: number[];
  /** Highest y a point may reach, in chart units: just below the top overlay. */
  topY: number;
  /** First point of the current stretch (the last divider), 0 without dividers. */
  currentFrom: number;
  dividers: number[];
  forecastX: number;
}

function toPoints(coords: ReadonlyArray<{ x: number; y: number }>): string {
  return coords.map((point) => `${point.x},${point.y}`).join(" ");
}

function toChartLine(line: ScoreChartSeries, index: number, context: LineContext): ChartLine {
  const shares = line.shares.length > 0 ? line.shares : [0];
  const { goalY, y } = shareToY(
    line.forecast === undefined ? shares : [...shares, line.forecast],
    context.goalTops[index]!,
    context.topY
  );
  const coords = drawnIndices(shares, context.dividers).map((point) => ({
    index: point,
    x: context.x(point),
    y: y(shares[point]!),
  }));
  const last = coords[coords.length - 1]!;
  return {
    key: line.key,
    tone: line.tone,
    goalText: line.goalText,
    goalY,
    pastPoints: toPoints(
      coords.filter((point) => point.index <= context.currentFrom && context.currentFrom > 0)
    ),
    points: toPoints(coords.filter((point) => point.index >= context.currentFrom)),
    last: { x: last.x, y: last.y },
    ...(line.forecast === undefined
      ? {}
      : {
          forecast: {
            x: context.forecastX,
            y: y(line.forecast),
            text: line.forecastText,
            labelShiftPx: 0,
          },
        }),
  };
}

function toMarkerMarks(
  markers: readonly ChartMarker[],
  count: number,
  x: (index: number) => number
): ChartMarkerMark[] {
  return markers
    .filter((marker) => marker.index >= 0 && marker.index < count)
    .filter((marker) => marker.kind !== "divider" || marker.index > 0)
    .map(({ index, kind, label, tone }) => ({ x: x(index), kind, label, tone }));
}

/**
 * Chart geometry (score-redesign D10, D31; chart-timeline D1–D6): all series on one chart, each
 * with its own scale from zero at the bottom to its goal line at its own height (`goalTops`).
 * The x axis is the whole run from turn 0 at the left edge (`timelineX`); the right part stays
 * free for the forecast, as wide as the forecast needs at the rendered width (`reserveShare`).
 * Markers are dividers (phase starts; the line before the last one is faded) and event ticks.
 * Pure, so unit-tested.
 */
export function toChartGeometry({
  series,
  markers = [],
  widthPx,
  heightPx,
  topInsetPx = 0,
}: ChartGeometryInput): ChartGeometry {
  const count = Math.max(1, ...series.map((line) => line.shares.length));
  const share = reserveShare(widthPx);
  const historyRight = CHART_WIDTH * (1 - share);
  const x = timelineX(count, historyRight);
  const marks = toMarkerMarks(markers, count, x);
  const dividers = markers
    .filter((marker) => marker.kind === "divider" && marker.index > 0 && marker.index < count)
    .map((marker) => marker.index);
  const width = widthPx && widthPx > 0 ? widthPx : DEFAULT_WIDTH_PX;
  const chartHeightPx = heightPx && heightPx > 0 ? heightPx : DEFAULT_HEIGHT_PX;
  const lastX = x(count - 1);
  const context: LineContext = {
    x,
    goalTops: goalTops(series.length, chartHeightPx, topInsetPx),
    topY: Math.max(TOP_Y, ((topInsetPx + OVERLAY_GAP_PX) / chartHeightPx) * CHART_HEIGHT),
    currentFrom: dividers.length > 0 ? Math.max(...dividers) : 0,
    dividers,
    forecastX: lastX + (FORECAST_SEGMENT_PX / width) * CHART_WIDTH,
  };
  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    historyRight,
    markers: marks,
    lines: spreadForecastLabels(
      series.map((line, index) => toChartLine(line, index, context)),
      chartHeightPx
    ),
  };
}
