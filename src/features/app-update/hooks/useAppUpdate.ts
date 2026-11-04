import { useRegisterSW } from "virtual:pwa-register/react";

export interface UseAppUpdateResult {
  /** A new version is downloaded and waiting to take over. */
  updateReady: boolean;
  /** Activate the waiting version and reload the page into it. */
  applyUpdate: () => void;
  /** Hide the prompt; the new version still activates on the next full load. */
  dismissUpdate: () => void;
}

/**
 * Registers the offline service worker (production builds only; the dev server serves a
 * no-op) and reports when a new deploy is waiting, so the player chooses when to reload
 * instead of losing a game in progress.
 */
export const useAppUpdate = (): UseAppUpdateResult => {
  const {
    needRefresh: [updateReady, setUpdateReady],
    updateServiceWorker,
  } = useRegisterSW();

  return {
    updateReady,
    applyUpdate: () => void updateServiceWorker(true),
    dismissUpdate: () => setUpdateReady(false),
  };
};
