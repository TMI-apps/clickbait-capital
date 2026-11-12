import { afterEach, describe, expect, it, vi } from "vitest";
import { JUICE_LIMITS } from "@/features/juice-engine/api";
import {
  createSoundEffect,
  hapticEffect,
  hapticPattern,
} from "@/features/juice-effects/services/deviceEffects";
import { createJuiceTestContext } from "../../../../tests/test-utils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("device effects", () => {
  it("should play the sound at its volume times the master volume when it runs", () => {
    const port = vi.fn();
    createSoundEffect(port).run(
      { effect: "sound", id: "card-viral", volume: 0.8 },
      createJuiceTestContext({ overrides: { volume: 0.5 } })
    );
    expect(port).toHaveBeenCalledWith("card-viral", { volume: 0.4, rate: 1 });
  });

  it("should vary the pitch within the jitter when a jitter is set", () => {
    const port = vi.fn();
    createSoundEffect(port).run(
      { effect: "sound", id: "ui-tap", rate: 1, rateJitter: 0.1 },
      createJuiceTestContext({ overrides: { random: () => 1 } })
    );
    expect(port.mock.calls[0][1].rate).toBeCloseTo(1.1);
  });

  it("should scale pulses by intensity and cap each pulse when parsing a pattern", () => {
    expect(hapticPattern("10 40 50", 2)).toEqual([20, 40, JUICE_LIMITS.hapticPulseMs]);
  });

  it("should vibrate the pattern when the device can vibrate", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { ...navigator, vibrate });
    hapticEffect.run({ effect: "haptic", pattern: "12" }, createJuiceTestContext());
    expect(vibrate).toHaveBeenCalledWith([12]);
  });

  it("should do nothing when the device has no vibration", () => {
    vi.stubGlobal("navigator", { ...navigator, vibrate: undefined });
    expect(hapticEffect.run({ effect: "haptic", pattern: "12" }, createJuiceTestContext())).toBe(
      undefined
    );
  });
});
