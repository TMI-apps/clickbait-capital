import { describe, expect, it } from "vitest";
import { nextRandom, pickRandom } from "./seededRandom";

describe("seededRandom", () => {
  it("should return the same sequence when started from the same state", () => {
    const run = (seed: number): number[] => {
      let state = seed;
      const values: number[] = [];
      for (let i = 0; i < 5; i++) {
        const next = nextRandom(state);
        values.push(next.value);
        state = next.state;
      }
      return values;
    };
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(43));
  });

  it("should return values in [0, 1) when called many times", () => {
    let state = 7;
    for (let i = 0; i < 1000; i++) {
      const next = nextRandom(state);
      expect(next.value).toBeGreaterThanOrEqual(0);
      expect(next.value).toBeLessThan(1);
      state = next.state;
    }
  });

  it("should pick an item from the list when the list is not empty", () => {
    const items = ["a", "b", "c"];
    const { item } = pickRandom(items, 1);
    expect(items).toContain(item);
  });

  it("should throw when the list is empty", () => {
    expect(() => pickRandom([], 1)).toThrow();
  });
});
