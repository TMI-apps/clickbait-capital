import { BOARD_HEADING_ID } from "@/features/game-board/hooks/useBoardScreenReader";
import { UI_COPY, fillTemplate } from "@/features/game-content/api";
import type { PhaseProgressView } from "@/features/game-board/types/gameBoard.types";

export interface PhaseProgressProps {
  phase: PhaseProgressView;
}

/**
 * Phase name and turn. The goal lives only in the score chart as two coloured goal lines
 * (score-redesign D30); screen readers hear it in the goal summary and in each number's text.
 */
export const PhaseProgress = ({ phase }: PhaseProgressProps) => (
  <section aria-label="Fase" className="min-w-0 flex-1">
    <h1
      id={BOARD_HEADING_ID}
      tabIndex={-1}
      className="flex items-baseline gap-2 font-heading outline-none text-base leading-tight font-bold sm:text-lg"
    >
      <span className="shrink-0 text-xs font-semibold text-muted-foreground uppercase">
        {fillTemplate(UI_COPY.board.phaseLabel, { phase: String(phase.phaseId) })}
      </span>
      <span className="truncate text-primary">{phase.phaseName}</span>
    </h1>
    <p className="text-xs text-muted-foreground tabular-nums">
      {fillTemplate(UI_COPY.board.turnLabel, { turn: String(phase.turn) })}
    </p>
    <p className="sr-only">{phase.goalDescription}</p>
  </section>
);
