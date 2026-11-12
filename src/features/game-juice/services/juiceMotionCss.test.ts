import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../../..");
const indexCss = readFileSync(resolve(repoRoot, "src/index.css"), "utf8");
const baseTokens = JSON.parse(
  readFileSync(resolve(repoRoot, "src/shared/theme/tokens/base.tokens.json"), "utf8")
) as { motion: Record<string, { $value?: { value: number; unit: string } }> };

/** Durations the juice animations run on; "Volledig" restores exactly these (game-juice D9). */
const JUICE_DURATIONS = [
  "duration-juice",
  "duration-juice-shake",
  "duration-count",
  "duration-card-draw",
  "duration-card-play",
];

/** The `:root[data-motion="full"]` block inside the reduced-motion media query. */
const fullMotionBlock = (): string => {
  const match =
    /@media \(prefers-reduced-motion: reduce\) \{\s*:root\[data-motion="full"\] \{([^}]*)\}/.exec(
      indexCss
    );
  return match?.[1] ?? "";
};

describe("juice motion CSS", () => {
  it("should restore every juice duration to its base token value when the player picks Volledig over an OS reduce request", () => {
    const block = fullMotionBlock();
    for (const token of JUICE_DURATIONS) {
      const base = baseTokens.motion[token].$value;
      expect(base, token).toBeDefined();
      expect(block).toContain(`--${token}: ${base?.value}${base?.unit};`);
    }
  });

  it("should leave the general UI durations to the OS when the player picks Volledig", () => {
    const block = fullMotionBlock();
    for (const token of ["duration-fast", "duration-normal", "duration-slow"]) {
      expect(block).not.toContain(`--${token}:`);
    }
  });

  it("should keep no CSS keyframes when that juice moved to the recipes", () => {
    for (const name of [
      "juice-particle",
      "juice-pop",
      "juice-flash",
      "juice-glow",
      "juice-burst",
      "juice-end",
    ]) {
      expect(indexCss).not.toContain(`@keyframes ${name} `);
    }
  });
});
