import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/common/Button/Button";
import { useAppUpdate } from "@/features/app-update/hooks/useAppUpdate";

/**
 * Slim bottom banner shown when a new deploy is waiting while the player is busy (the update
 * applies by itself at a safe moment, app-update D1). Reloading now is the player's choice so a
 * running game is never cut off; "Later" hides it until the update applies on leaving the game.
 */
export const UpdatePrompt = () => {
  const { updateReady, applyUpdate, dismissUpdate } = useAppUpdate();

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-lg border bg-popover py-1 pl-3 pr-1 text-sm text-popover-foreground elevation-lg"
    >
      <RefreshCw aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1 leading-tight">
        <span className="font-semibold">Nieuwe versie klaar.</span>{" "}
        <span className="text-muted-foreground">Laadt na dit spel.</span>
      </span>
      <Button type="button" size="sm" onClick={applyUpdate}>
        Nu laden
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Later" onClick={dismissUpdate}>
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
};
