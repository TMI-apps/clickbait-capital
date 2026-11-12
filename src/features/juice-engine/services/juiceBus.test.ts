import { describe, expect, it, vi } from "vitest";
import { createJuiceBus } from "@/features/juice-engine/services/juiceBus";

type Events = { "card.played": { variant: string }; "ui.press": Record<string, never> };

describe("createJuiceBus", () => {
  it("should deliver an event to every listener when it is emitted", () => {
    const bus = createJuiceBus<Events>();
    const first = vi.fn();
    const second = vi.fn();
    bus.listen(first);
    bus.listen(second);
    bus.emit("card.played", { variant: "viral" });
    expect(first).toHaveBeenCalledWith("card.played", { variant: "viral" });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("should keep delivering when one listener throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const bus = createJuiceBus<Events>();
    const after = vi.fn();
    bus.listen(() => {
      throw new Error("boom");
    });
    bus.listen(after);
    bus.emit("ui.press");
    expect(after).toHaveBeenCalledWith("ui.press", {});
    warn.mockRestore();
  });

  it("should hand fresh events to the first listener when they were emitted before anyone listened", () => {
    let time = 0;
    const bus = createJuiceBus<Events>(() => time);
    bus.emit("ui.press");
    time = 500;
    bus.emit("card.played", { variant: "ad" });
    time = 1200;
    const listener = vi.fn();
    bus.listen(listener);
    expect(listener.mock.calls).toEqual([["card.played", { variant: "ad" }]]);
  });

  it("should stop delivering when the listener unsubscribes", () => {
    const bus = createJuiceBus<Events>();
    const listener = vi.fn();
    const stop = bus.listen(listener);
    stop();
    bus.emit("ui.press");
    expect(listener).not.toHaveBeenCalled();
  });
});
