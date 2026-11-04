import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";

export interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onQuit: () => void;
}

/** Pause menu: resume or quit to the start screen. Escape and the close button also resume. */
export const PauseMenu = ({ open, onResume, onQuit }: PauseMenuProps) => (
  <Modal
    closeLabel={UI_COPY.settings.closeButton}
    open={open}
    onClose={onResume}
    title={UI_COPY.board.pauseTitle}
  >
    <div className="flex flex-col gap-2">
      <Button className="min-h-11" onClick={onResume}>
        {UI_COPY.board.resumeButton}
      </Button>
      <Button variant="outline" className="min-h-11" onClick={onQuit}>
        {UI_COPY.board.quitButton}
      </Button>
    </div>
  </Modal>
);
