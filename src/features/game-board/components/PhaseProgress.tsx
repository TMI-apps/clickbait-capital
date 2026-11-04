import { Flag } from "lucide-react";
import type { PhaseProgressView } from "@/features/game-board/types/gameBoard.types";

export interface PhaseProgressProps {
  phase: PhaseProgressView;
}

/** Phase name, goal text, progress bar and the absolute stats the goal reads. */
export const PhaseProgress = ({ phase }: PhaseProgressProps) => {
  const percent = Math.round(phase.progress * 100);
  return (
    <section aria-label="Fase en mijlpaal" className="min-w-0 flex-1">
      <h1 className="flex items-baseline gap-2 font-heading text-base leading-tight font-bold sm:text-lg">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground uppercase">
          Fase {phase.phaseId}/{phase.phaseCount}
        </span>
        <span className="truncate text-primary">{phase.phaseName}</span>
      </h1>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Flag aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0">{phase.goalDescription}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Voortgang mijlpaal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--duration-slow) ease-(--ease-standard)"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground tabular-nums">
        <span>{phase.usersText}</span>
        <span>{phase.revenueText}</span>
        {phase.streak && (
          <span>
            {phase.streak.current}/{phase.streak.required} beurten op rij
          </span>
        )}
        <span>Beurt {phase.turn}</span>
      </p>
    </section>
  );
};
