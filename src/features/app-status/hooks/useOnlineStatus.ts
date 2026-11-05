import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getOnline = (): boolean => navigator.onLine;

/** Whether the browser reports a network connection; updates on `online` / `offline`. */
export const useOnlineStatus = (): boolean =>
  useSyncExternalStore(subscribe, getOnline, () => true);
