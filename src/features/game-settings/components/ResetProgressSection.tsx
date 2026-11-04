import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";
import { useResetProgress } from "@/features/game-settings/hooks/useResetProgress";

const COPY = UI_COPY.settings;

/** "Voortgang wissen" with a confirm dialog; announces the result politely. */
export const ResetProgressSection = () => {
  const resetProgress = useResetProgress();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const confirm = (): void => {
    resetProgress();
    setConfirming(false);
    setDone(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => {
          setDone(false);
          setConfirming(true);
        }}
      >
        {COPY.resetProgress}
      </Button>
      <p className="text-sm text-muted-foreground">{COPY.resetHint}</p>
      <p role="status" className="text-sm font-semibold">
        {done ? COPY.resetDone : ""}
      </p>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={COPY.resetProgress}
        description={COPY.resetConfirm}
        closeLabel={COPY.closeButton}
        actions={
          <>
            <Button variant="outline" className="min-h-11" onClick={() => setConfirming(false)}>
              {COPY.resetCancelButton}
            </Button>
            <Button variant="destructive" className="min-h-11" onClick={confirm}>
              {COPY.resetConfirmButton}
            </Button>
          </>
        }
      />
    </div>
  );
};
