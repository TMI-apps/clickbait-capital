import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";
import type { GameEndView, PhaseProgressView } from "@/features/game-board/types/gameBoard.types";

export interface GameEndDialogProps {
  end: GameEndView | null;
  phase: PhaseProgressView;
  onRestart: () => void;
  onQuit: () => void;
}

/** Minimal win / game over screen. The full endings and end report come in the game-flow lap. */
export const GameEndDialog = ({ end: current, phase, onRestart, onQuit }: GameEndDialogProps) => {
  const end = useRetainedValue(current);
  return (
    <Modal
      open={current !== null}
      dismissible={false}
      title={
        end
          ? end.outcome === "won"
            ? end.title
            : `${UI_COPY.results.lostKicker}: ${end.title}`
          : undefined
      }
      description={end?.headline}
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
      {end && (
        <div className="flex flex-col gap-2 text-sm">
          <p>{end.message}</p>
          {end.lesson && <p className="font-semibold">{end.lesson}</p>}
        </div>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        Fase {phase.phaseId}: {phase.phaseName} · {phase.turn} beurten · {phase.usersText} ·{" "}
        {phase.revenueText}
      </p>
    </Modal>
  );
};
