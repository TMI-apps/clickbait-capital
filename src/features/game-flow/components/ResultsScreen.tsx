import { Button } from "@/components/common/Button";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
import type { ResultRow, ResultsView } from "@/features/game-flow/types/gameFlow.types";
import {
  type ShareCardContent,
  ShareResultButton,
  type ShareResultCopy,
} from "@/features/result-share/api";
import { FlowScreen } from "./FlowScreen";

export interface ResultsScreenProps {
  results: ResultsView;
  /** Share card of the run (both outcomes). */
  share: ShareCardContent;
  shareCopy: ShareResultCopy;
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
export const ResultsScreen = ({
  results,
  share,
  shareCopy,
  onRestart,
  onQuit,
}: ResultsScreenProps) => (
  <FlowScreen
    title={
      <>
        {/* The lost ending's heading reads the same title; this tells screen readers the report opened. */}
        <span className="sr-only">Je rapport.</span> {results.title}
      </>
    }
    actions={
      <>
        <Button variant="outline" className="min-h-11" onClick={onQuit}>
          {UI_COPY.results.backToStartButton}
        </Button>
        <ShareResultButton content={share} copy={shareCopy} />
        <Button className="min-h-11" onClick={onRestart}>
          {UI_COPY.results.playAgainButton}
        </Button>
      </>
    }
  >
    {results.intro && (
      <p className="text-base">
        <GlossaryText text={results.intro} glossary={GLOSSARY} />
      </p>
    )}
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
