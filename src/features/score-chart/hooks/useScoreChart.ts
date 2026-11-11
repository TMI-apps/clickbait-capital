import { useMemo } from "react";
import { toChartGeometry } from "@/features/score-chart/services/scoreChart";
import type {
  ChartGeometry,
  ScoreChartSeries,
} from "@/features/score-chart/types/scoreChart.types";

/** The chart geometry for the shown series, recomputed only when they change. */
export function useScoreChart(
  series: readonly ScoreChartSeries[],
  markers: readonly number[] | undefined
): ChartGeometry {
  return useMemo(() => toChartGeometry(series, markers), [series, markers]);
}
