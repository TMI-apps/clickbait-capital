import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { useScoreChart } from "@/features/score-chart/hooks/useScoreChart";
import type { ScoreChartSeries } from "@/features/score-chart/types/scoreChart.types";

export interface ScoreChartProps {
  series: ScoreChartSeries[];
  /** Points the x axis holds; the newest point is drawn on the right. */
  slots: number;
  /** Laid over the chart, e.g. the counters along its bottom (the caller makes them readable). */
  children?: ReactNode;
  className?: string;
}

/**
 * Stock-style score chart (score-redesign D10, D31, mockup C): all lines on one chart, each
 * racing to its own dashed goal line in its own colour at its own height, labelled with the goal
 * value. The chart itself is `aria-hidden`; `children` (the counters) sit on top of it and speak.
 */
export const ScoreChart = ({ series, slots, children, className }: ScoreChartProps) => {
  const { width, height, lines } = useScoreChart(series, slots);
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="absolute inset-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          {lines.map((line) => (
            <g key={line.key} className={line.tone}>
              <line
                x1={0}
                x2={width}
                y1={line.goalY}
                y2={line.goalY}
                className="stroke-current opacity-80"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={line.points}
                fill="none"
                className="stroke-current"
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={line.last.x} cy={line.last.y} r={3} className="fill-current" />
            </g>
          ))}
        </svg>
        {lines.map((line) => (
          <span
            key={line.key}
            className={`absolute left-0 -translate-y-full rounded-sm bg-card/80 px-1 font-mono text-[0.65rem] leading-4 font-bold tabular-nums ${line.tone}`}
            style={{ top: `${(line.goalY / height) * 100}%` }}
          >
            {line.goalText}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
};
