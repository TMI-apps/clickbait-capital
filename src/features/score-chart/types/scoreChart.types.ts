/** One line of the score chart: its values as a share of the goal line (1 = on the line, 0 = zero). */
export interface ScoreChartSeries {
  key: string;
  /** The whole run, oldest first: turn 0 at the left edge, the newest point on the right. */
  shares: number[];
  /** Text colour token class that colours the line and its goal (e.g. `text-meter-users`). */
  tone: string;
  /** The goal value as text, drawn in the line's colour at its goal line ("100.000"). */
  goalText: string;
  /** Where the line would land after the held card, as a share of the goal; drawn dashed. */
  forecast?: number;
  /** The forecast's change as text ("+15.000"), shown next to the forecast dot. */
  forecastText?: string;
}

/**
 * A mark on the chart's time axis at a point index. A `divider` starts a new stretch (a phase): a
 * dashed vertical line with an optional label, and the line before the last divider is drawn
 * faded. An `event` is a short tick on the bottom edge in its `tone` (a text colour class).
 */
export interface ChartMarker {
  index: number;
  kind: "divider" | "event";
  label?: string;
  tone?: string;
}

/** One drawn line: the faded part before the current stretch, the strong part, and its points. */
export interface ChartLine {
  key: string;
  tone: string;
  goalText: string;
  /** This line's goal line, in chart units. */
  goalY: number;
  /** Polyline points before the current stretch (faded); empty when there is no divider. */
  pastPoints: string;
  /** Polyline points of the current stretch. */
  points: string;
  last: { x: number; y: number };
  /** The forecast point in the free right part of the chart, when the series has a forecast. */
  forecast?: {
    x: number;
    y: number;
    text?: string;
    /** Vertical nudge of the delta label in CSS pixels, so two labels never overlap. */
    labelShiftPx: number;
  };
}

/** A marker placed on the x axis, in chart units. */
export interface ChartMarkerMark {
  x: number;
  kind: ChartMarker["kind"];
  label?: string;
  tone?: string;
}

/** Where the lines, their goal lines and the markers sit in the chart box. */
export interface ChartGeometry {
  width: number;
  height: number;
  /** Right end of the history, in chart units: the rest is kept free for the forecast. */
  historyRight: number;
  markers: ChartMarkerMark[];
  lines: ChartLine[];
}

/** Input of `toChartGeometry`. */
export interface ChartGeometryInput {
  series: readonly ScoreChartSeries[];
  markers?: readonly ChartMarker[];
  /** Rendered chart width in CSS pixels: sets how wide the free forecast part is. */
  widthPx?: number;
  /** Rendered chart height in CSS pixels: places the goal lines below the top overlay. */
  heightPx?: number;
  /** Height of the overlay laid over the top (the counters): goal labels stay below it. */
  topInsetPx?: number;
}
