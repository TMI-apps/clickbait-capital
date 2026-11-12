import { useEffect } from "react";
import { Flag, Lightbulb } from "lucide-react";
import { Button } from "@/components/common/Button";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { getPhaseImage } from "@/features/card-imagery/api";
import { GLOSSARY, PHASE_INTROS, UI_COPY } from "@/features/game-content/api";
import type { FlowPhase } from "@/features/game-flow/types/gameFlow.types";
import {
  PHASE_INTRO_TAG,
  emitJuice,
  stopJuice,
  type JuicePhaseVariant,
} from "@/features/game-juice/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import { cn } from "@/shared/utils/cn";
import { FlowScreen } from "./FlowScreen";

export interface PhaseTransitionScreenProps {
  phase: FlowPhase;
  onContinue: () => void;
}

/**
 * Phase intro when a phase starts: where you are now, what changes, and the new goal. The step
 * dots are decorative; the kicker ("Fase 2") in the focused heading says where you are. The
 * phase's photo (card-imagery `getPhaseImage`) sits behind the heading as the hero.
 */
export const PhaseTransitionScreen = ({ phase, onContinue }: PhaseTransitionScreenProps) => {
  const intro = PHASE_INTROS[phase.phaseId];
  const steps = Array.from({ length: phase.phaseCount }, (_, index) => index + 1);
  const stepAnchor = useJuiceAnchor("phase:step");
  const goalAnchor = useJuiceAnchor("phase:goal");
  // The new phase's dot lights up and its goal box glows (`phase.intro`). Its steps wait for the
  // screen's entrance, so leaving early stops them: without their anchors they would burst
  // from the middle of the board (juice-wiring-flow D10).
  useEffect(() => {
    emitJuice("phase.intro", { variant: String(phase.phaseId) as JuicePhaseVariant });
    return () => stopJuice(PHASE_INTRO_TAG);
  }, [phase.phaseId]);
  return (
    <FlowScreen
      kicker={intro.kicker}
      title={intro.title}
      heroImage={getPhaseImage(phase.phaseId) ?? undefined}
      icon={
        <ol aria-hidden="true" className="flex gap-1.5">
          {steps.map((step) => (
            <li
              key={step}
              ref={step === phase.phaseId ? stepAnchor : undefined}
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
      <p className="text-base">
        <GlossaryText text={intro.body} glossary={GLOSSARY} />
      </p>
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          <GlossaryText text={intro.tip} glossary={GLOSSARY} />
        </span>
      </p>
      <section
        ref={goalAnchor}
        className="rounded-lg border p-4"
        aria-labelledby="phase-goal-label"
      >
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
