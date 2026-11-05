/** How often an open app asks the server for a newer service worker. */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** The part of `ServiceWorkerRegistration` the checks need (keeps the service testable). */
export interface UpdatableRegistration {
  update: () => Promise<unknown>;
}

/**
 * Browsers only re-check `sw.js` on a full navigation, so an installed app resumed from the
 * background would never notice a deploy. Asks for an update whenever the app returns to the
 * foreground and once an hour while it stays open. Returns a function that stops the checks.
 */
export const watchForUpdates = (registration: UpdatableRegistration): (() => void) => {
  const check = (): void => {
    // Offline or a server hiccup: the next check tries again.
    registration.update().catch(() => undefined);
  };
  const onVisibilityChange = (): void => {
    if (document.visibilityState === "visible") check();
  };

  const interval = window.setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
};
