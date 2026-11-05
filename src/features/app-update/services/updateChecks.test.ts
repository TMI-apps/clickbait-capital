import { describe, it, expect, vi, afterEach } from "vitest";
import { watchForUpdates } from "@/features/app-update/services/updateChecks";

const setVisibility = (state: DocumentVisibilityState): void => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
};

const fakeRegistration = () => ({ update: vi.fn().mockResolvedValue(undefined) });

describe("watchForUpdates", () => {
  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("should check for a new version when the app returns to the foreground", () => {
    const registration = fakeRegistration();
    const stop = watchForUpdates(registration);
    setVisibility("hidden");
    expect(registration.update).not.toHaveBeenCalled();
    setVisibility("visible");
    expect(registration.update).toHaveBeenCalledOnce();
    stop();
  });

  it("should check for a new version every hour while open", () => {
    vi.useFakeTimers();
    const registration = fakeRegistration();
    const stop = watchForUpdates(registration);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(registration.update).toHaveBeenCalledOnce();
    stop();
  });

  it("should stop checking when stopped", () => {
    vi.useFakeTimers();
    const registration = fakeRegistration();
    watchForUpdates(registration)();
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    setVisibility("visible");
    expect(registration.update).not.toHaveBeenCalled();
  });

  it("should swallow a failed check when the device is offline", async () => {
    const registration = { update: vi.fn().mockRejectedValue(new Error("offline")) };
    const stop = watchForUpdates(registration);
    setVisibility("visible");
    // An unhandled rejection would fail the run; let the rejected check settle first.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(registration.update).toHaveBeenCalledOnce();
    stop();
  });
});
