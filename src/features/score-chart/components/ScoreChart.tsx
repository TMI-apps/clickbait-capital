import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { useScoreChart } from "@/features/score-chart/hooks/useScoreChart";
import type { ScoreChartSeries } from "@/features/score-chart/types/scoreChart.types";

export interface ScoreChartProps {
  series: ScoreChartSeries[];
  /** Point indices that start a new stretch (phase starts): drawn as subtle vertical ticks. */
  markers?: number[];
  /** Laid over the chart, e.g. the counters along its bottom (the caller makes them readable). */
  children?: ReactNode;
  className?: string;
}

/** Subtle dashed vertical ticks where a phase began (chart-timeline D3). */
const MarkerTicks = ({ xs, height }: { xs: number[]; height: number }) =>
  xs.map((x) => (
    <line
      key={`marker-${x}`}
      data-chart-marker=""
      x1={x}
      x2={x}
      y1={0}
      y2={height}
      className="stroke-muted-foreground opacity-40"
      strokeWidth={1}
      strokeDasharray="2 3"
      vectorEffect="non-scaling-stroke"
    />
  ));

/**
 * Stock-style score chart (score-redesign D10, D31, mockup C): all lines on one chart, each
 * racing to its own dashed goal line in its own colour at its own height, labelled with the goal
 * value. Strokes do not scale (`vector-effect`) and the end dots and labels are HTML, so they stay
 * round and sharp however the SVG stretches. The x axis is the whole run from turn 0 on the left;
 * the right third stays free (chart-timeline D2), and `markers` show where a phase began. A
 * series' `forecast` adds a dashed segment to a hollow dot in that free part: where the line
 * lands if the held card is played (D12). The chart itself is `aria-hidden`; `children` (the counters) sit on top of it and speak.
 */
export const ScoreChart = ({ series, markers, children, className }: ScoreChartProps) => {
  const { width, height, lines, markers: markerXs } = useScoreChart(series, markers);
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="absolute inset-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          <MarkerTicks xs={markerXs} height={height} />
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
              {line.forecast && (
                <line
                  x1={line.last.x}
                  y1={line.last.y}
                  x2={line.forecast.x}
                  y2={line.forecast.y}
                  className="stroke-current animate-in fade-in-0 duration-(--duration-fast)"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          ))}
        </svg>
        {/* End dots as HTML: the SVG stretches non-uniformly, so an SVG circle would be an oval. */}
        {lines.map((line) => (
          <span
            key={`${line.key}-dot`}
            className={cn("absolute size-2 -translate-1/2 rounded-full bg-current", line.tone)}
            style={{
              left: `${(line.last.x / width) * 100}%`,
              top: `${(line.last.y / height) * 100}%`,
            }}
          />
        ))}
        {lines.map(
          (line) =>
            line.forecast && (
              <span
                key={`${line.key}-forecast`}
                data-chart-forecast={line.key}
                className={cn(
                  "absolute size-2.5 -translate-1/2 rounded-full border-2 border-current bg-card animate-in fade-in-0 zoom-in-50 duration-(--duration-fast)",
                  line.tone
                )}
                style={{
                  left: `${(line.forecast.x / width) * 100}%`,
                  top: `${(line.forecast.y / height) * 100}%`,
                }}
              />
            )
        )}
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
