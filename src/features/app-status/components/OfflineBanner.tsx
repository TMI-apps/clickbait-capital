import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { UI_COPY } from "@/features/game-content/api";
import { useOnlineStatus } from "@/features/app-status/hooks/useOnlineStatus";

/** How long the notice stays on screen; the game keeps working offline, so it must not linger. */
const VISIBLE_MS = 6000;

/**
 * Short, non-blocking notice when the connection drops (the app plays offline). It hides
 * itself after a few seconds and comes back on the next drop; the live region keeps it for
 * screen readers.
 */
export const OfflineBanner = () => {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [previousOnline, setPreviousOnline] = useState(online);
  if (previousOnline !== online) {
    setPreviousOnline(online);
    setDismissed(false);
  }

  useEffect(() => {
    if (online) return;
    const timer = window.setTimeout(() => setDismissed(true), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [online]);

  const visible = !online && !dismissed;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[max(0.5rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-md justify-center"
    >
      {visible && (
        <p className="flex items-center gap-2 rounded-lg border bg-popover px-4 py-2 text-sm text-popover-foreground elevation-lg">
          <CloudOff aria-hidden="true" className="size-4 shrink-0" />
          {UI_COPY.appStatus.offlineBanner}
        </p>
      )}
    </div>
  );
};
