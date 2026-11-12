import { describe, expect, it } from "vitest";
import { clampJuice, parseDurationMs } from "@/features/juice-engine/services/juiceEffect";

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

describe("clampJuice", () => {
  it("should clamp into the range and turn non-finite values into the minimum when given any number", () => {
    expect(clampJuice(5, 0, 1)).toBe(1);
    expect(clampJuice(-1, 0, 1)).toBe(0);
    expect(clampJuice(Number.NaN, 0.25, 3)).toBe(0.25);
  });
});
