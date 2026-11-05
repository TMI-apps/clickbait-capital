import { beforeEach, describe, expect, it } from "vitest";
import { clearGameStorage, GAME_STORAGE_PREFIX } from "./gameStorage";
import { MOTION_STORAGE_KEY } from "./motionPreference";

describe("clearGameStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("should remove only prefixed game keys when other keys exist", () => {
    window.localStorage.setItem("clickbait-capital:audio-muted", "true");
    window.localStorage.setItem(MOTION_STORAGE_KEY, "reduced");
    window.localStorage.setItem("color-mode", "light");

    expect(clearGameStorage()).toBe(2);
    expect(window.localStorage.getItem("color-mode")).toBe("light");
    expect(window.localStorage.length).toBe(1);
  });

  it("should use the game prefix for the motion key when it is defined", () => {
    expect(MOTION_STORAGE_KEY.startsWith(GAME_STORAGE_PREFIX)).toBe(true);
  });

  it("should return zero when storage throws", () => {
    const broken = {
      get length(): number {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(clearGameStorage(broken)).toBe(0);
  });
});
