import { useScoreChart } from "@/features/score-chart/hooks/useScoreChart";
import type { ScoreChartSeries } from "@/features/score-chart/types/scoreChart.types";

export interface ScoreChartProps {
  series: ScoreChartSeries[];
  /** Points the x axis holds; the newest point is drawn on the right. */
  slots: number;
}

/**
 * Stock-style score chart (score-redesign D10, D30, mockup C): one lane per series, each line
 * racing to its own dashed goal line in its own colour, labelled with the goal value. Visual
 * only (`aria-hidden`); the caller speaks the numbers and goals.
 */
export const ScoreChart = ({ series, slots }: ScoreChartProps) => {
  const { width, height, lines } = useScoreChart(series, slots);
  return (
    <div aria-hidden="true" className="relative h-24 sm:h-28 board-desk:h-48">
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
          className={`absolute right-0 -translate-y-full rounded-sm bg-card/80 px-1 font-mono text-[0.65rem] leading-4 font-bold tabular-nums ${line.tone}`}
          style={{ top: `${(line.goalY / height) * 100}%` }}
        >
          {line.goalText}
        </span>
      ))}
    </div>
  );
};
