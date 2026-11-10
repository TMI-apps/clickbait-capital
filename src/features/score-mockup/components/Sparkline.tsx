import { cn } from "@/shared/utils/cn";

export interface SparklineProps {
  points: number[];
  /** Dashed preview of the next turns when a card is selected. */
  forecast?: number[] | null;
  /** Phase goal: dashed horizontal line. */
  goal?: number;
  className?: string;
}

const W = 100;
const H = 32;

/** Plain-SVG trend line with goal line and forecast (no chart library, score-redesign plan). */
export const Sparkline = ({ points, forecast, goal, className }: SparklineProps) => {
  const values = [...points, ...(forecast ?? [])];
  // The goal line joins the scale only when it is near, so early growth is not squashed flat.
  const goalNear = goal !== undefined && goal <= Math.max(...values) * 1.3;
  const all = goalNear ? [...values, goal] : values;
  const min = Math.min(...all) * 0.9;
  const max = Math.max(...all) * 1.04;
  const slots = Math.max(8, points.length + (forecast?.length ?? 0)) - 1;
  const x = (index: number): number => (index / slots) * W;
  const y = (value: number): number => H - ((value - min) / (max - min || 1)) * H;
  const line = points.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const last = points.length - 1;
  const ahead = forecast
    ? [points[last]!, ...forecast].map((value, index) => `${x(last + index)},${y(value)}`).join(" ")
    : null;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full overflow-visible", className)}
    >
      {goalNear && (
        <line
          x1={0}
          x2={W}
          y1={y(goal)}
          y2={y(goal)}
          className="stroke-muted-foreground/60"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <polyline
        points={line}
        fill="none"
        className="stroke-current"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {ahead && (
        <polyline
          points={ahead}
          fill="none"
          className="stroke-current opacity-70"
          strokeWidth={2}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle cx={x(last)} cy={y(points[last]!)} r={2.2} className="fill-current" />
    </svg>
  );
};
