import { describe, expect, it } from "vitest";
import { isBrowserSupported } from "./browserSupport";

const modernEnv = {
  matchMedia: () => undefined,
  localStorage: {},
  CSS: { supports: () => true },
};

describe("isBrowserSupported", () => {
  it("should accept a browser when every required feature exists", () => {
    expect(isBrowserSupported(modernEnv)).toBe(true);
  });

  it("should reject a browser when matchMedia is missing", () => {
    expect(isBrowserSupported({ ...modernEnv, matchMedia: undefined })).toBe(false);
  });

  it("should reject a browser when CSS.supports is missing", () => {
    expect(isBrowserSupported({ ...modernEnv, CSS: undefined })).toBe(false);
  });
});
