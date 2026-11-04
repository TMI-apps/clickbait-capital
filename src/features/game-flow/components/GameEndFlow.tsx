import { useGameEndFlow } from "@/features/game-flow/hooks/useGameEndFlow";
import type { RunSummary } from "@/features/game-flow/types/gameFlow.types";
import { EndingScreen } from "./EndingScreen";
import { ResultsScreen } from "./ResultsScreen";

export interface GameEndFlowProps {
  summary: RunSummary;
  onRestart: () => void;
  onQuit: () => void;
}

/** End of a run: the dramatic ending first, then the sober results with the report. */
export const GameEndFlow = ({ summary, onRestart, onQuit }: GameEndFlowProps) => {
  const { ending, results, showResults, openResults } = useGameEndFlow(summary);
  return showResults ? (
    <ResultsScreen results={results} onRestart={onRestart} onQuit={onQuit} />
  ) : (
    <EndingScreen ending={ending} onContinue={openResults} />
  );
};
