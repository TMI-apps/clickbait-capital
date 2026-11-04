import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

export interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onQuit: () => void;
}

/** Pause menu: resume or quit to the start screen. Escape and the close button also resume. */
export const PauseMenu = ({ open, onResume, onQuit }: PauseMenuProps) => (
  <Modal
    closeLabel="Sluiten"
    open={open}
    onClose={onResume}
    title="Pauze"
    description="Het spel staat stil."
  >
    <div className="flex flex-col gap-2">
      <Button className="min-h-11" onClick={onResume}>
        Verder spelen
      </Button>
      <Button variant="outline" className="min-h-11" onClick={onQuit}>
        Stoppen en naar start
      </Button>
    </div>
  </Modal>
);
