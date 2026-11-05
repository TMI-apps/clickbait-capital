import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";
import { SettingsPanel } from "@/features/game-settings/api";

export interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onQuit: () => void;
}

/**
 * Pause menu: resume, settings or quit to the start screen. Escape and the close button also
 * resume. Settings open inside the dialog (not `/instellingen`), so the run in memory survives.
 */
export const PauseMenu = ({ open, onResume, onQuit }: PauseMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const resume = (): void => {
    setShowSettings(false);
    onResume();
  };

  return (
    <Modal
      closeLabel={UI_COPY.settings.closeButton}
      open={open}
      onClose={resume}
      title={showSettings ? UI_COPY.settings.title : UI_COPY.board.pauseTitle}
    >
      {showSettings ? (
        <div className="flex flex-col gap-4">
          <SettingsPanel />
          <Button variant="outline" className="min-h-11" onClick={() => setShowSettings(false)}>
            {UI_COPY.settings.backButton}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button className="min-h-11" onClick={resume}>
            {UI_COPY.board.resumeButton}
          </Button>
          <Button variant="outline" className="min-h-11" onClick={() => setShowSettings(true)}>
            {UI_COPY.settings.openButton}
          </Button>
          <Button variant="outline" className="min-h-11" onClick={onQuit}>
            {UI_COPY.board.quitButton}
          </Button>
        </div>
      )}
    </Modal>
  );
};
