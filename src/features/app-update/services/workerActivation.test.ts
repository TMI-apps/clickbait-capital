import { describe, it, expect, vi } from "vitest";
import {
  activateWaitingWorker,
  type ActivatableWorker,
} from "@/features/app-update/services/workerActivation";

/** A worker the test moves through its lifecycle by hand. */
const fakeWorker = () => {
  const target = new EventTarget();
  const worker = {
    state: "installed" as ServiceWorkerState,
    postMessage: vi.fn(),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  } satisfies ActivatableWorker;
  const moveTo = (state: ServiceWorkerState): void => {
    worker.state = state;
    target.dispatchEvent(new Event("statechange"));
  };
  return { worker, moveTo };
};

const settled = async (promise: Promise<void>): Promise<boolean> => {
  let done = false;
  void promise.then(() => (done = true));
  await Promise.resolve();
  await Promise.resolve();
  return done;
};

describe("activateWaitingWorker", () => {
  it("should resolve at once when no worker is waiting because the new version is already active", async () => {
    await expect(activateWaitingWorker({ waiting: null })).resolves.toBeUndefined();
  });

  it("should ask the waiting worker to skip waiting and resolve only once it is activated", async () => {
    const { worker, moveTo } = fakeWorker();
    const activation = activateWaitingWorker({ waiting: worker });

    expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    moveTo("activating");
    expect(await settled(activation)).toBe(false);
    moveTo("activated");
    expect(await settled(activation)).toBe(true);
  });

  it("should resolve when the waiting worker turns redundant so the page still reloads", async () => {
    const { worker, moveTo } = fakeWorker();
    const activation = activateWaitingWorker({ waiting: worker });
    moveTo("redundant");
    expect(await settled(activation)).toBe(true);
  });
});
