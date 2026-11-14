import { describe, expect, it } from "vitest";
import { APP_NAME_SUGGESTIONS } from "@/features/app-name/services/appNameSuggestions";
import {
  checkAppName,
  isBlockedAppName,
  suggestAppName,
} from "@/features/app-name/services/appNameRules";

describe("checkAppName", () => {
  it("should accept and clean a name when it has letters, digits, spaces, dashes or underscores", () => {
    expect(checkAppName("  Pixel   plein ")).toEqual({ ok: true, name: "Pixel plein" });
    expect(checkAppName("Ré_app-2")).toEqual({ ok: true, name: "Ré_app-2" });
  });

  it("should refuse the name with the matching reason when it is empty, too short or too long", () => {
    expect(checkAppName("   ")).toEqual({ ok: false, error: "empty" });
    expect(checkAppName("P")).toEqual({ ok: false, error: "short" });
    expect(checkAppName("Pp")).toMatchObject({ ok: true });
    expect(checkAppName("A".repeat(16))).toMatchObject({ ok: true });
    expect(checkAppName("A".repeat(17))).toEqual({ ok: false, error: "long" });
  });

  it("should refuse the name when it has other characters such as emoji or punctuation", () => {
    expect(checkAppName("Pixel!")).toEqual({ ok: false, error: "chars" });
    expect(checkAppName("App 🚀")).toEqual({ ok: false, error: "chars" });
    expect(checkAppName("<b>app</b>")).toEqual({ ok: false, error: "chars" });
  });

  it("should refuse the name when it hides a swear word behind case, spaces or letter swaps", () => {
    for (const name of [
      "Kankerapp",
      "K4NK3R",
      "tyfus-app",
      "kut",
      "Super Kut",
      "k u t",
      "Sh1tFeed",
    ]) {
      expect(checkAppName(name), name).toEqual({ ok: false, error: "blocked" });
    }
  });

  it("should accept an ordinary word when a short swear word only sits inside it", () => {
    for (const name of ["Catering", "Grapefruit", "Pikkie", "Massafeed", "Kickoff"]) {
      expect(checkAppName(name), name).toMatchObject({ ok: true });
    }
  });

  it("should refuse the name when it names a real platform or brand", () => {
    for (const name of [
      "TikTok",
      "tik tok",
      "Insta-gram",
      "YouTube 2",
      "Meta",
      "X",
      "Brawl Stars",
    ]) {
      expect(isBlockedAppName(name), name).toBe(true);
    }
  });
});

describe("suggestAppName", () => {
  it("should offer only names the rules accept when the suggestions are checked", () => {
    for (const name of APP_NAME_SUGGESTIONS) {
      expect(checkAppName(name), name).toEqual({ ok: true, name });
    }
  });

  it("should never repeat the current name when the dice is rolled", () => {
    const current = APP_NAME_SUGGESTIONS[0];
    for (const value of [0, 0.25, 0.5, 0.75, 0.999]) {
      const next = suggestAppName(current, () => value);
      expect(next).not.toBe(current);
      expect(APP_NAME_SUGGESTIONS).toContain(next);
    }
  });
});
