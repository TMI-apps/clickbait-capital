import { Flag, Lightbulb } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PHASE_INTROS, UI_COPY } from "@/features/game-content/api";
import type { FlowPhase } from "@/features/game-flow/types/gameFlow.types";
import { cn } from "@/shared/utils/cn";
import { FlowScreen } from "./FlowScreen";

export interface PhaseTransitionScreenProps {
  phase: FlowPhase;
  onContinue: () => void;
}

/** Phase intro when a phase starts: where you are now, what changes, and the new goal. */
export const PhaseTransitionScreen = ({ phase, onContinue }: PhaseTransitionScreenProps) => {
  const intro = PHASE_INTROS[phase.phaseId];
  const steps = Array.from({ length: phase.phaseCount }, (_, index) => index + 1);
  return (
    <FlowScreen
      kicker={intro.kicker}
      title={intro.title}
      icon={
        <ol aria-label={intro.kicker} className="flex gap-1.5">
          {steps.map((step) => (
            <li
              key={step}
              aria-current={step === phase.phaseId ? "step" : undefined}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                step <= phase.phaseId ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </ol>
      }
      actions={
        <Button className="min-h-11" onClick={onContinue}>
          {UI_COPY.phaseIntro.continueButton}
        </Button>
      }
    >
      <p className="text-base">{intro.body}</p>
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{intro.tip}</span>
      </p>
      <section className="rounded-lg border p-4" aria-labelledby="phase-goal-label">
        <h2
          id="phase-goal-label"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"
        >
          <Flag aria-hidden="true" className="size-3.5" />
          {UI_COPY.board.goalLabel}
        </h2>
        <p className="mt-1 text-base font-semibold">{phase.goalDescription}</p>
      </section>
    </FlowScreen>
  );
};
