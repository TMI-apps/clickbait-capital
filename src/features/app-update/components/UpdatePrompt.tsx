import { RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button/Button";
import { useAppUpdate } from "@/features/app-update/hooks/useAppUpdate";

/**
 * Small bottom banner shown when a new deploy is waiting. Reloading is the player's choice so a
 * running game is never cut off; "Later" keeps the old version until the next full load.
 */
export const UpdatePrompt = () => {
  const { updateReady, applyUpdate, dismissUpdate } = useAppUpdate();

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-lg border bg-popover p-2 pl-4 text-sm text-popover-foreground elevation-lg"
    >
      <RefreshCw aria-hidden="true" className="size-5 shrink-0" />
      <span className="flex-1">Nieuwe versie beschikbaar</span>
      <Button type="button" variant="ghost" onClick={dismissUpdate}>
        Later
      </Button>
      <Button type="button" onClick={applyUpdate}>
        Herladen
      </Button>
    </div>
  );
};
