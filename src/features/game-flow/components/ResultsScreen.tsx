import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api";
import type { ResultRow, ResultsView } from "@/features/game-flow/types/gameFlow.types";
import { FlowScreen } from "./FlowScreen";

export interface ResultsScreenProps {
  results: ResultsView;
  onRestart: () => void;
  onQuit: () => void;
}

const ResultList = ({ rows }: { rows: ResultRow[] }) => (
  <dl className="divide-y text-sm">
    {rows.map((row) => (
      <div key={row.id} className="flex items-baseline justify-between gap-4 py-2">
        <dt className="text-muted-foreground">{row.label}</dt>
        <dd className="text-right font-semibold tabular-nums">{row.value}</dd>
      </div>
    ))}
  </dl>
);

/** The sober results after an ending: numbers, no drama. */
export const ResultsScreen = ({ results, onRestart, onQuit }: ResultsScreenProps) => (
  <FlowScreen
    title={results.title}
    actions={
      <>
        <Button variant="outline" className="min-h-11" onClick={onQuit}>
          {UI_COPY.results.backToStartButton}
        </Button>
        <Button className="min-h-11" onClick={onRestart}>
          {UI_COPY.results.playAgainButton}
        </Button>
      </>
    }
  >
    {results.intro && <p className="text-base">{results.intro}</p>}
    <section aria-labelledby="results-stats">
      <h2 id="results-stats" className="text-sm font-semibold">
        {UI_COPY.results.statsTitle}
      </h2>
      <ResultList rows={[...results.stats, ...results.report]} />
    </section>
    <section aria-labelledby="results-played">
      <h2 id="results-played" className="text-sm font-semibold">
        {UI_COPY.results.playedTitle}
      </h2>
      <ResultList rows={results.played} />
    </section>
  </FlowScreen>
);
