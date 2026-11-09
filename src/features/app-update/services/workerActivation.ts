/** The message Workbox's generated `sw.js` answers with `self.skipWaiting()`. */
const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;

/** The part of `ServiceWorker` activation needs (keeps the service testable). */
export interface ActivatableWorker {
  readonly state: ServiceWorkerState;
  postMessage: (message: unknown) => void;
  addEventListener: (type: "statechange", listener: () => void) => void;
  removeEventListener: (type: "statechange", listener: () => void) => void;
}

/** The part of `ServiceWorkerRegistration` activation needs. */
export interface WaitingRegistration {
  readonly waiting: ActivatableWorker | null;
}

const isSettled = (state: ServiceWorkerState): boolean =>
  state === "activated" || state === "redundant";

/**
 * Makes the newest deploy the active service worker; the caller reloads afterwards.
 *
 * A worker only waits while the old one controls a page. When this page isn't controlled (first
 * visit before any reload, or after a hard reload: the generated worker doesn't claim clients) the
 * new worker activates at once, nothing waits, and `controllerchange` never fires here — so the
 * plugin's skip-waiting-then-reload-on-`controllerchange` did nothing (app-update-flow D4).
 * Resolving on the worker's own state works for both cases.
 */
export const activateWaitingWorker = async (registration: WaitingRegistration): Promise<void> => {
  const worker = registration.waiting;
  if (!worker) return;
  await new Promise<void>((resolve) => {
    const onStateChange = (): void => {
      if (!isSettled(worker.state)) return;
      worker.removeEventListener("statechange", onStateChange);
      resolve();
    };
    worker.addEventListener("statechange", onStateChange);
    worker.postMessage(SKIP_WAITING_MESSAGE);
  });
};
