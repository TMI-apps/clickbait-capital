import { describe, expect, it, vi } from "vitest";
import { createHapticsStore } from "@/features/game-settings/services/hapticsPreference";

const store = (stored: string | null) => {
  const write = vi.fn();
  return { write, haptics: createHapticsStore({ read: () => stored, write }) };
};

describe("createHapticsStore", () => {
  it("should vibrate by default when nothing is stored", () => {
    expect(store(null).haptics.getEnabled()).toBe(true);
  });

  it("should stay off when the player switched vibration off before", () => {
    expect(store("off").haptics.getEnabled()).toBe(false);
  });

  it("should store the choice and tell listeners when the player switches it", () => {
    const { haptics, write } = store(null);
    const listener = vi.fn();
    haptics.subscribe(listener);
    haptics.setEnabled(false);
    expect(haptics.getEnabled()).toBe(false);
    expect(write).toHaveBeenLastCalledWith("off");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should turn back on and forget the choice when reset", () => {
    const { haptics, write } = store("off");
    haptics.reset();
    expect(haptics.getEnabled()).toBe(true);
    expect(write).toHaveBeenLastCalledWith(null);
  });
});
