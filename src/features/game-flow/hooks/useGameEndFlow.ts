import { useCallback, useMemo, useState } from "react";
import type { ShareCardContent, ShareResultCopy } from "@/features/result-share/api";
import {
  SHARE_RESULT_COPY,
  toEndingView,
  toResultsView,
  toShareCardContent,
} from "@/features/game-flow/services/endFlow";
import type {
  EndingView,
  ResultsView,
  RunSummary,
} from "@/features/game-flow/types/gameFlow.types";

export interface GameEndFlowState {
  ending: EndingView;
  results: ResultsView;
  /** What the results screen's share button draws and sends. */
  share: ShareCardContent;
  shareCopy: ShareResultCopy;
  /** False while the ending shows, true once the player opened the results. */
  showResults: boolean;
  openResults: () => void;
}

/** Ending → results step of a finished run, with both views derived from the run summary. */
export function useGameEndFlow(summary: RunSummary): GameEndFlowState {
  const [showResults, setShowResults] = useState(false);
  const ending = useMemo(() => toEndingView(summary), [summary]);
  const results = useMemo(() => toResultsView(summary), [summary]);
  const share = useMemo(() => toShareCardContent(summary), [summary]);
  const openResults = useCallback(() => setShowResults(true), []);
  return { ending, results, share, shareCopy: SHARE_RESULT_COPY, showResults, openResults };
}
