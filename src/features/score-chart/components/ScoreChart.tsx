import { Flag } from "lucide-react";
import { useScoreChart } from "@/features/score-chart/hooks/useScoreChart";
import type { ScoreChartSeries } from "@/features/score-chart/types/scoreChart.types";

export interface ScoreChartProps {
  series: ScoreChartSeries[];
  /** Points the x axis holds; the newest point is drawn on the right. */
  slots: number;
  /** Label of the goal line ("Doel"). */
  goalLabel: string;
}

/**
 * Stock-style score chart (score-redesign D10, mockup C): every series as a line racing to the
 * dashed goal line. Visual only (`aria-hidden`); the caller speaks the numbers.
 */
export const ScoreChart = ({ series, slots, goalLabel }: ScoreChartProps) => {
  const { width, height, goalY, lines } = useScoreChart(series, slots);
  return (
    <div aria-hidden="true" className="relative">
      <span className="absolute top-0 right-0 flex items-center gap-1 text-[0.65rem] font-bold text-success uppercase">
        <Flag className="size-3" />
        {goalLabel}
      </span>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-16 w-full overflow-visible sm:h-20 board-desk:h-40"
      >
        <rect x={0} y={0} width={width} height={goalY} className="fill-success/10" />
        <line
          x1={0}
          x2={width}
          y1={goalY}
          y2={goalY}
          className="stroke-success"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          vectorEffect="non-scaling-stroke"
        />
        {lines.map((line) => (
          <g key={line.key} className={line.tone}>
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
    </div>
  );
};
