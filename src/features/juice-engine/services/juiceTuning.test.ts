import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_JUICE_TUNING,
  JUICE_TUNING_RANGES,
  createJuiceTuning,
  juiceStepKey,
  parseJuiceOverrides,
} from "@/features/juice-engine/services/juiceTuning";
import type { JuiceRecipeBook } from "@/features/juice-engine/types/juiceEngine.types";

const BOOK: JuiceRecipeBook = {
  hit: {
    steps: [{ effect: "sound", id: "ping", volume: 0.5 }],
    variants: { big: [{ effect: "shake", strength: 4 }] },
  },
};

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    read: () => value,
    write: (next: string | null) => {
      value = next;
    },
    peek: () => value,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createJuiceTuning", () => {
  it("should return the shipped recipes and defaults when nothing is overridden", () => {
    const store = createJuiceTuning({ book: BOOK });
    expect(store.getBook()).toBe(BOOK);
    expect(store.getTuning()).toEqual(DEFAULT_JUICE_TUNING);
  });

  it("should apply a step override to that step only when a value is set", () => {
    const store = createJuiceTuning({ book: BOOK });
    store.setStepValue({ event: "hit", branch: "big", index: 0 }, "strength", 7);
    expect(store.getBook().hit.variants?.big[0]).toEqual({ effect: "shake", strength: 7 });
    expect(store.getBook().hit.steps?.[0]).toEqual(BOOK.hit.steps?.[0]);
  });

  it("should clamp global knobs into their ranges when a value is out of range", () => {
    const store = createJuiceTuning({ book: BOOK });
    store.setGlobal("intensity", 99);
    store.setGlobal("motionScale", 0);
    expect(store.getTuning().intensity).toBe(JUICE_TUNING_RANGES.intensity.max);
    expect(store.getTuning().motionScale).toBe(JUICE_TUNING_RANGES.motionScale.min);
  });

  it("should persist overrides once after the write delay and restore them when recreated", () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = createJuiceTuning({ book: BOOK, storage, writeDelayMs: 250 });
    store.setGlobal("volume", 0.4);
    store.setGlobal("volume", 0.3);
    expect(storage.peek()).toBeNull();
    vi.advanceTimersByTime(250);
    const again = createJuiceTuning({ book: BOOK, storage });
    expect(again.getTuning().volume).toBe(0.3);
  });

  it("should clear storage and overrides when reset", () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = createJuiceTuning({ book: BOOK, storage, writeDelayMs: 0 });
    store.setStepValue({ event: "hit", branch: "steps", index: 0 }, "volume", 1);
    vi.runAllTimers();
    store.reset();
    vi.runAllTimers();
    expect(storage.peek()).toBeNull();
    expect(store.getBook()).toBe(BOOK);
  });

  it("should pick up changes from storage when reload is called", () => {
    const storage = memoryStorage();
    const store = createJuiceTuning({ book: BOOK, storage });
    const listener = vi.fn();
    store.subscribe(listener);
    storage.write(JSON.stringify({ global: { intensity: 1.5 } }));
    store.reload();
    expect(store.getTuning().intensity).toBe(1.5);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should export the overrides as JSON keyed by event, branch and index when asked", () => {
    const store = createJuiceTuning({ book: BOOK });
    store.setStepValue({ event: "hit", branch: "big", index: 0 }, "strength", 2);
    expect(JSON.parse(store.exportOverrides())).toEqual({
      global: undefined,
      steps: { [juiceStepKey("hit", "big", 0)]: { strength: 2 } },
    });
  });

  it("should keep working with defaults when storage throws", () => {
    const store = createJuiceTuning({
      book: BOOK,
      storage: {
        read: () => {
          throw new Error("blocked");
        },
        write: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(store.getTuning()).toEqual(DEFAULT_JUICE_TUNING);
  });
});

describe("parseJuiceOverrides", () => {
  it("should drop unknown keys and non-finite numbers when stored data is malformed", () => {
    const parsed = parseJuiceOverrides(
      JSON.stringify({
        global: { intensity: "loud", volume: 0.5, extra: 1 },
        steps: { "a/steps/0": { count: 3, bad: { nested: true } }, "b/steps/0": 4 },
      })
    );
    expect(parsed).toEqual({ global: { volume: 0.5 }, steps: { "a/steps/0": { count: 3 } } });
    expect(parseJuiceOverrides("{not json")).toEqual({});
  });
});
