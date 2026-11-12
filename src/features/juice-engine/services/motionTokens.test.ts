import { describe, expect, it } from "vitest";
import { parseDurationMs } from "@/features/juice-engine/services/motionTokens";

describe("parseDurationMs", () => {
  it("should read ms, seconds and the reduced-motion value when given CSS durations", () => {
    expect(parseDurationMs("320ms", 1)).toBe(320);
    expect(parseDurationMs(" 0.4s", 1)).toBe(400);
    expect(parseDurationMs("0.01ms", 1)).toBe(0.01);
  });

  it("should fall back when the token is missing", () => {
    expect(parseDurationMs("", 600)).toBe(600);
  });
});
