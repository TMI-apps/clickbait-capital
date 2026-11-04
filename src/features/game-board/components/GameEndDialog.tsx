import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { GameEndView, PhaseProgressView } from "@/features/game-board/types/gameBoard.types";

export interface GameEndDialogProps {
  end: GameEndView | null;
  phase: PhaseProgressView;
  onRestart: () => void;
  onQuit: () => void;
}

/** Minimal win / game over screen. The full endings and end report come in the game-flow lap. */
export const GameEndDialog = ({ end, phase, onRestart, onQuit }: GameEndDialogProps) => (
  <Modal
    open={end !== null}
    dismissible={false}
    title={end ? (end.outcome === "won" ? end.title : `Game over: ${end.title}`) : undefined}
    description={end?.message}
    actions={
      <>
        <Button variant="outline" className="min-h-11" onClick={onQuit}>
          Home
        </Button>
        <Button className="min-h-11" onClick={onRestart}>
          Opnieuw spelen
        </Button>
      </>
    }
  >
    <p className="text-sm text-muted-foreground">
      Fase {phase.phaseId}: {phase.phaseName} · {phase.turn} beurten · {phase.usersText} ·{" "}
      {phase.revenueText}
    </p>
  </Modal>
);
