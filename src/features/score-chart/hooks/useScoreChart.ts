import { useMemo } from "react";
import { toChartGeometry } from "@/features/score-chart/services/scoreChart";
import type {
  ChartGeometry,
  ChartMarker,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** The chart geometry, recomputed only when the series, markers or the rendered width change. */
export function useScoreChart(
  series: readonly ScoreChartSeries[],
  markers: readonly ChartMarker[] | undefined,
  widthPx: number
): ChartGeometry {
  return useMemo(() => toChartGeometry({ series, markers, widthPx }), [series, markers, widthPx]);
}
