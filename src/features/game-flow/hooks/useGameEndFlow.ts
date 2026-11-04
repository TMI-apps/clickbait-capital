import { useCallback, useMemo, useState } from "react";
import { toEndingView, toResultsView } from "@/features/game-flow/services/endFlow";
import type {
  EndingView,
  ResultsView,
  RunSummary,
} from "@/features/game-flow/types/gameFlow.types";

export interface GameEndFlowState {
  ending: EndingView;
  results: ResultsView;
  /** False while the ending shows, true once the player opened the results. */
  showResults: boolean;
  openResults: () => void;
}

/** Ending → results step of a finished run, with both views derived from the run summary. */
export function useGameEndFlow(summary: RunSummary): GameEndFlowState {
  const [showResults, setShowResults] = useState(false);
  const ending = useMemo(() => toEndingView(summary), [summary]);
  const results = useMemo(() => toResultsView(summary), [summary]);
  const openResults = useCallback(() => setShowResults(true), []);
  return { ending, results, showResults, openResults };
}
