import { afterEach, describe, expect, it, vi } from "vitest";
import { GAME_STORAGE_PREFIX } from "@/features/game-settings/api";
import type { SavedRun } from "@/features/game-save/types/savedRun.types";
import {
  SAVED_RUN_KEY,
  clearSavedRun,
  readSavedRun,
  writeSavedRun,
} from "@/features/game-save/services/savedRunStorage";

const RUN: SavedRun = {
  version: 8,
  seed: 42,
  actions: [
    { kind: "card", cardId: "viral-kattenvideo" },
    { kind: "option", optionId: "commercial" },
  ],
};

describe("savedRunStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return the same run when it was written and read back", () => {
    writeSavedRun(RUN);

    expect(readSavedRun()).toEqual(RUN);
  });

  it("should use a versioned key under the game prefix when it stores a run", () => {
    expect(SAVED_RUN_KEY).toBe("clickbait-capital:run:v8");
    expect(SAVED_RUN_KEY.startsWith(GAME_STORAGE_PREFIX)).toBe(true);
  });

  it("should return null when nothing is saved", () => {
    expect(readSavedRun()).toBeNull();
  });

  it("should discard the save when the stored text is not JSON", () => {
    window.localStorage.setItem(SAVED_RUN_KEY, "{not json");

    expect(readSavedRun()).toBeNull();
    expect(window.localStorage.getItem(SAVED_RUN_KEY)).toBeNull();
  });

  it.each([
    ["another version", { ...RUN, version: 1 }],
    ["a missing seed", { version: 8, actions: [] }],
    ["a fractional seed", { ...RUN, seed: 1.5 }],
    ["actions that are not a list", { ...RUN, actions: "card" }],
    ["an unknown action kind", { ...RUN, actions: [{ kind: "skip", cardId: "x" }] }],
    ["an action without an id", { ...RUN, actions: [{ kind: "card" }] }],
    ["null", null],
  ])("should discard the save when it has %s", (_label, value) => {
    window.localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(value));

    expect(readSavedRun()).toBeNull();
    expect(window.localStorage.getItem(SAVED_RUN_KEY)).toBeNull();
  });

  it("should remove the run when it is cleared", () => {
    writeSavedRun(RUN);

    clearSavedRun();

    expect(readSavedRun()).toBeNull();
  });

  it("should not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => writeSavedRun(RUN)).not.toThrow();
    expect(readSavedRun()).toBeNull();
    expect(() => clearSavedRun()).not.toThrow();
  });
});
