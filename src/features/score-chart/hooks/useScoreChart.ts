import { useMemo } from "react";
import { toChartGeometry } from "@/features/score-chart/services/scoreChart";
import type {
  ChartGeometry,
  ChartGeometryInput,
} from "@/features/score-chart/types/scoreChart.types";

/** The chart geometry, recomputed only when the series, markers or a measured size change. */
export function useScoreChart({
  series,
  markers,
  widthPx,
  heightPx,
  topInsetPx,
}: ChartGeometryInput): ChartGeometry {
  return useMemo(
    () => toChartGeometry({ series, markers, widthPx, heightPx, topInsetPx }),
    [series, markers, widthPx, heightPx, topInsetPx]
  );
}
