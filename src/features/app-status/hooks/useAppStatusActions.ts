import { goHome, reloadPage } from "@/features/app-status/services/appNavigation";
import { isBrowserSupported } from "@/features/app-status/services/browserSupport";

/** Checked once per page load; platform features do not appear or vanish at runtime. */
const SUPPORTED = isBrowserSupported();

export interface AppStatusActions {
  /** Full reload: retries a failed chunk and clears the error boundary. */
  retry: () => void;
  /** Hard navigation to the start screen. */
  goHome: () => void;
}

/** The two ways out of an app status screen. */
export const useAppStatusActions = (): AppStatusActions => ({ retry: reloadPage, goHome });

/** Whether this browser has what the game needs (see `isBrowserSupported`). */
export const useBrowserSupported = (): boolean => SUPPORTED;
