import { describe, expect, it } from "vitest";
import { particlePaths } from "@/features/game-juice/services/particlePaths";
import { parseDurationMs } from "@/features/game-juice/services/motionTokens";

const viewport = { x: 390, y: 844 };

describe("particlePaths", () => {
  it("should return one path per particle with the requested glyph set when bursting", () => {
    const paths = particlePaths({
      kind: "emoji",
      count: 12,
      origin: { x: 200, y: 600 },
      target: null,
      viewport,
    });
    expect(paths).toHaveLength(12);
    expect(new Set(paths.map((path) => path.glyph))).toEqual(new Set(["🔥", "😱", "😡"]));
    expect(paths.every((path) => path.dy < 0)).toBe(true);
  });

  it("should land every coin near the target when a target is given", () => {
    const origin = { x: 300, y: 700 };
    const target = { x: 60, y: 90 };
    const paths = particlePaths({ kind: "coin", count: 10, origin, target, viewport });
    for (const path of paths) {
      expect(Math.abs(origin.x + path.dx - target.x)).toBeLessThanOrEqual(10);
      expect(Math.abs(origin.y + path.dy - target.y)).toBeLessThanOrEqual(10);
    }
  });

  it("should give the same paths when called twice with the same input", () => {
    const options = {
      kind: "confetti" as const,
      count: 5,
      origin: { x: 0, y: 0 },
      target: null,
      viewport,
    };
    expect(particlePaths(options)).toEqual(particlePaths(options));
  });
});

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
