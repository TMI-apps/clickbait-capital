/** One line of the score chart: its values as a share of the goal line (1 = on the line). */
export interface ScoreChartSeries {
  key: string;
  /** Oldest first; the newest point is drawn on the right. */
  shares: number[];
  /** Text colour token class that colours the line (e.g. `text-meter-users`). */
  tone: string;
}

/** One drawn line: polyline points and its newest point. */
export interface ChartLine {
  key: string;
  tone: string;
  points: string;
  last: { x: number; y: number };
}

/** Where the goal line and the lines sit in the chart box. */
export interface ChartGeometry {
  width: number;
  height: number;
  goalY: number;
  lines: ChartLine[];
}
