import { afterEach, describe, expect, it, vi } from "vitest";
import { MUTE_STORAGE_KEY, readStoredMuted, storeMuted } from "./muteStorage";

describe("muteStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("should read back the stored mute choice when storage works", () => {
    storeMuted(true);

    expect(window.localStorage.getItem(MUTE_STORAGE_KEY)).toBe("true");
    expect(readStoredMuted()).toBe(true);
  });

  it("should default to sound on when nothing is stored", () => {
    expect(readStoredMuted()).toBe(false);
  });

  it("should not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => storeMuted(true)).not.toThrow();
    expect(readStoredMuted()).toBe(false);
  });
});
