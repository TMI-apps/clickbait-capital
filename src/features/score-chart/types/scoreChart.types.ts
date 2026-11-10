/** One line of the score chart: its values as a share of the goal line (1 = on the line). */
export interface ScoreChartSeries {
  key: string;
  /** Oldest first; the newest point is drawn on the right. */
  shares: number[];
  /** Text colour token class that colours the line and its goal (e.g. `text-meter-users`). */
  tone: string;
  /** The goal value as text, drawn in the line's colour at its goal line ("100.000"). */
  goalText: string;
}

/** One drawn line: polyline points and its newest point. */
export interface ChartLine {
  key: string;
  tone: string;
  goalText: string;
  /** This line's goal line, in chart units. */
  goalY: number;
  points: string;
  last: { x: number; y: number };
}

/** Where the lines and their goal lines sit in the chart box. */
export interface ChartGeometry {
  width: number;
  height: number;
  lines: ChartLine[];
}
