import { useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { useElementSize } from "@/features/score-chart/hooks/useElementSize";
import { useScoreChart } from "@/features/score-chart/hooks/useScoreChart";
import type {
  ChartLine,
  ChartMarker,
  ChartMarkerMark,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

export interface ScoreChartProps {
  series: ScoreChartSeries[];
  /** Dividers (phase starts) and event ticks on the time axis, by point index. */
  markers?: ChartMarker[];
  /**
   * Laid over the top of the chart, e.g. the counters in its corners (the caller makes them
   * readable). The goal lines and their labels stay below it; the lines run behind it.
   */
  children?: ReactNode;
  className?: string;
}

/** `left` / `top` of a chart point as a share of the box, for HTML laid over the SVG. */
const at = ({ x, y }: { x: number; y: number }, width: number, height: number) => ({
  left: `${(x / width) * 100}%`,
  top: `${(y / height) * 100}%`,
});

/** Dividers as dashed full-height lines, events as short ticks on the bottom edge. */
const MarkerLines = ({ marks, height }: { marks: ChartMarkerMark[]; height: number }) =>
  marks.map((mark, index) =>
    mark.kind === "divider" ? (
      <line
        key={`divider-${index}`}
        data-chart-marker="divider"
        x1={mark.x}
        x2={mark.x}
        y1={0}
        y2={height}
        className="stroke-muted-foreground opacity-50"
        strokeWidth={1}
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
    ) : (
      <line
        key={`event-${index}`}
        data-chart-marker="event"
        x1={mark.x}
        x2={mark.x}
        y1={height * 0.92}
        y2={height}
        className={cn("stroke-current", mark.tone ?? "text-muted-foreground")}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    )
  );

/** One series: dashed goal line, the faded past, the strong current stretch and its forecast. */
const LinePaths = ({ line, width }: { line: ChartLine; width: number }) => (
  <g className={line.tone}>
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
    {line.pastPoints && (
      <polyline
        points={line.pastPoints}
        fill="none"
        className="stroke-current opacity-40"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    )}
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
);

/** The forecast dot and its delta label in the line's colour, right of the dot. */
const ForecastMark = ({
  line,
  width,
  height,
}: {
  line: ChartLine;
  width: number;
  height: number;
}) =>
  line.forecast ? (
    <>
      <span
        data-chart-forecast={line.key}
        className={cn(
          "absolute size-2.5 -translate-1/2 rounded-full border-2 border-current bg-card animate-in fade-in-0 zoom-in-50 duration-(--duration-fast)",
          line.tone
        )}
        style={at(line.forecast, width, height)}
      />
      {line.forecast.text && (
        <span
          data-chart-forecast-text={line.key}
          className={cn(
            "absolute ml-2 -translate-y-1/2 rounded-sm bg-card/80 px-0.5 font-mono text-[0.65rem] leading-4 font-bold whitespace-nowrap tabular-nums animate-in fade-in-0 duration-(--duration-fast)",
            line.tone
          )}
          style={{
            ...at(line.forecast, width, height),
            marginTop: `${line.forecast.labelShiftPx}px`,
          }}
        >
          {line.forecast.text}
        </span>
      )}
    </>
  ) : null;

/**
 * Stock-style score chart (score-redesign D10, D31, mockup C; chart-timeline D1–D6): all lines on
 * one chart from zero at the bottom, each racing to its own dashed goal line in its own colour,
 * labelled with the goal value above its left end. The x axis is the whole run from turn 0 on the
 * left; the right part stays free for the forecast, sized from the measured width. Dividers mark
 * phase starts (the line before the last one is faded), event ticks mark scandals and world
 * events. Strokes do not scale (`vector-effect`) and dots and labels are HTML, so they stay round
 * and sharp however the SVG stretches. A series' `forecast` adds a dashed segment to a hollow dot
 * with its delta: where the line lands if the held card is played (D12). The chart itself is
 * `aria-hidden`; `children` (the counters) sit on top of it and speak.
 */
export const ScoreChart = ({ series, markers, children, className }: ScoreChartProps) => {
  const box = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const size = useElementSize(box);
  const overlaySize = useElementSize(overlay);
  const geometry = useScoreChart({
    series,
    markers,
    widthPx: size.width,
    heightPx: size.height,
    topInsetPx: overlaySize.height,
  });
  const { width, height, lines } = geometry;
  return (
    <div ref={box} className={cn("relative", className)}>
      <div aria-hidden="true" className="absolute inset-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          <MarkerLines marks={geometry.markers} height={height} />
          {lines.map((line) => (
            <LinePaths key={line.key} line={line} width={width} />
          ))}
        </svg>
        {geometry.markers.map(
          (mark, index) =>
            mark.label && (
              <span
                key={`label-${index}`}
                className="absolute bottom-2 ml-1 font-mono text-[0.6rem] leading-3 font-bold text-muted-foreground"
                style={{ left: `${(mark.x / width) * 100}%` }}
              >
                {mark.label}
              </span>
            )
        )}
        {/* End dots as HTML: the SVG stretches non-uniformly, so an SVG circle would be an oval. */}
        {lines.map((line) => (
          <span
            key={`${line.key}-dot`}
            className={cn("absolute size-2 -translate-1/2 rounded-full bg-current", line.tone)}
            style={at(line.last, width, height)}
          />
        ))}
        {lines.map((line) => (
          <ForecastMark key={`${line.key}-forecast`} line={line} width={width} height={height} />
        ))}
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
      <div ref={overlay} className="absolute inset-x-0 top-0">
        {children}
      </div>
    </div>
  );
};
