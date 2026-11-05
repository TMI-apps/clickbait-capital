import { useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useSafeUpdateMoment } from "@/features/app-update/hooks/useSafeUpdateMoment";
import { watchForUpdates } from "@/features/app-update/services/updateChecks";

export interface UseAppUpdateResult {
  /** A new version is downloaded and waiting to take over. */
  updateReady: boolean;
  /** Activate the waiting version and reload the page into it. */
  applyUpdate: () => void;
  /** Hide the prompt; the update still applies on the next route change or app start. */
  dismissUpdate: () => void;
}

/**
 * Registers the offline service worker (production builds only; the dev server serves a
 * no-op), keeps asking for new deploys while the app is open, and applies a waiting one at a
 * safe moment (`useSafeUpdateMoment`). During a game the prompt lets the player choose.
 */
export const useAppUpdate = (): UseAppUpdateResult => {
  const {
    needRefresh: [updateReady, setUpdateReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_swUrl, registration) => {
      // App-lifetime watcher: the registration lives as long as the page.
      if (registration) watchForUpdates(registration);
    },
  });

  const applyUpdate = useCallback(() => void updateServiceWorker(true), [updateServiceWorker]);
  useSafeUpdateMoment({ updateReady, applyUpdate });

  return {
    updateReady,
    applyUpdate,
    dismissUpdate: () => setUpdateReady(false),
  };
};
