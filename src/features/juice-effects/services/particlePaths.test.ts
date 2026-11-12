import { describe, expect, it } from "vitest";
import { particlePaths, splitGlyphs } from "@/features/juice-effects/services/particlePaths";

const viewport = { x: 390, y: 844 };
const GLYPHS = ["🔥", "😱", "😡"];

describe("particlePaths", () => {
  it("should return one path per particle with the requested glyph set when bursting", () => {
    const paths = particlePaths({
      glyphs: GLYPHS,
      count: 12,
      origin: { x: 200, y: 600 },
      target: null,
      viewport,
    });
    expect(paths).toHaveLength(12);
    expect(new Set(paths.map((path) => path.glyph))).toEqual(new Set(GLYPHS));
    expect(paths.every((path) => path.dy < 0)).toBe(true);
  });

  it("should land every particle near the target when a target is given", () => {
    const origin = { x: 300, y: 700 };
    const target = { x: 60, y: 90 };
    const paths = particlePaths({ glyphs: ["🪙"], count: 10, origin, target, viewport });
    for (const path of paths) {
      expect(Math.abs(origin.x + path.dx - target.x)).toBeLessThanOrEqual(10);
      expect(Math.abs(origin.y + path.dy - target.y)).toBeLessThanOrEqual(10);
    }
  });

  it("should give the same paths when called twice with the same input", () => {
    const options = { glyphs: ["🎉"], count: 5, origin: { x: 0, y: 0 }, target: null, viewport };
    expect(particlePaths(options)).toEqual(particlePaths(options));
  });

  it("should reach further when the reach is larger", () => {
    const base = { glyphs: GLYPHS, count: 6, origin: { x: 0, y: 0 }, target: null, viewport };
    const near = particlePaths({ ...base, reach: 0.2 });
    const far = particlePaths({ ...base, reach: 0.6 });
    expect(Math.abs(far[0].dy)).toBeGreaterThan(Math.abs(near[0].dy));
  });
});

describe("splitGlyphs", () => {
  it("should keep multi-code-point emoji whole when splitting a glyph string", () => {
    expect(splitGlyphs("🔥 😱😡")).toEqual(GLYPHS);
    expect(splitGlyphs("👩‍💻✨")).toEqual(["👩‍💻", "✨"]);
  });
});
