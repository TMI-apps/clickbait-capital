import { describe, expect, it, vi } from "vitest";
import { createJuiceDirector } from "@/features/juice-engine/services/juiceDirector";
import { JUICE_LIMITS, defineJuiceEffect } from "@/features/juice-engine/services/juiceEffect";
import { DEFAULT_JUICE_TUNING } from "@/features/juice-engine/services/juiceTuning";
import type {
  JuiceEffectContext,
  JuiceGates,
  JuiceRecipeBook,
  JuiceStepData,
  JuiceTuning,
} from "@/features/juice-engine/types/juiceEngine.types";

interface Played {
  effect: string;
  step: JuiceStepData;
  context: JuiceEffectContext;
}

/** A manual clock and scheduler, so delays run only when the test advances time. */
function createClock() {
  let time = 0;
  const tasks: Array<{ at: number; task: () => void; cancelled: boolean }> = [];
  return {
    now: () => time,
    schedule: (task: () => void, ms: number) => {
      const entry = { at: time + ms, task, cancelled: false };
      tasks.push(entry);
      return () => {
        entry.cancelled = true;
      };
    },
    advance: (ms: number) => {
      time += ms;
      tasks
        .filter((entry) => !entry.cancelled && entry.at <= time)
        .forEach((entry) => {
          entry.cancelled = true;
          entry.task();
        });
    },
  };
}

function setup(book: JuiceRecipeBook, overrides: Partial<JuiceTuning> = {}) {
  const played: Played[] = [];
  const cancels: string[] = [];
  const record =
    (id: string) =>
    (step: JuiceStepData, context: JuiceEffectContext): (() => void) => {
      played.push({ effect: id, step, context });
      return () => cancels.push(id);
    };
  const effects = {
    shake: defineJuiceEffect({
      id: "shake",
      channel: "motion",
      reducedMotion: "skip",
      params: {},
      run: record("shake"),
    }),
    badge: defineJuiceEffect({
      id: "badge",
      channel: "motion",
      reducedMotion: "static",
      params: {},
      run: record("badge"),
    }),
    flash: defineJuiceEffect<{ effect: "flash"; target?: string }>({
      id: "flash",
      channel: "motion",
      reducedMotion: "skip",
      params: {},
      flashes: (step) => step.target === "screen",
      run: record("flash"),
    }),
    sound: defineJuiceEffect({
      id: "sound",
      channel: "sound",
      reducedMotion: "keep",
      params: {},
      run: record("sound"),
    }),
    haptic: defineJuiceEffect({
      id: "haptic",
      channel: "haptic",
      reducedMotion: "keep",
      params: {},
      run: record("haptic"),
    }),
  };
  const gates: JuiceGates = { reducedMotion: false, haptics: true };
  const tuning: JuiceTuning = { ...DEFAULT_JUICE_TUNING, ...overrides };
  const clock = createClock();
  const director = createJuiceDirector({
    effects,
    getBook: () => book,
    getTuning: () => tuning,
    getGates: () => gates,
    schedule: clock.schedule,
    now: clock.now,
    random: () => 0.5,
    isHidden: () => false,
    findAnchor: () => null,
    getStage: () => null,
  });
  return { director, played, cancels, gates, clock };
}

const effectsOf = (played: Played[]): string[] => played.map((entry) => entry.effect);

describe("createJuiceDirector", () => {
  it("should play the shared steps and then the variant's steps when the event names a variant", () => {
    const { director, played } = setup({
      hit: {
        steps: [{ effect: "sound" }],
        variants: { big: [{ effect: "shake" }], small: [{ effect: "badge" }] },
      },
    });
    director.play("hit", { variant: "big" });
    expect(effectsOf(played)).toEqual(["sound", "shake"]);
  });

  it("should delay a step by its at times the motion scale when at is set", () => {
    const { director, played, clock } = setup(
      { hit: { steps: [{ effect: "shake", at: 100 }] } },
      { motionScale: 2 }
    );
    director.play("hit", {});
    clock.advance(199);
    expect(played).toHaveLength(0);
    clock.advance(1);
    expect(effectsOf(played)).toEqual(["shake"]);
  });

  it("should drop skip effects and play static effects as reduced when motion is reduced", () => {
    const { director, played, gates } = setup({
      hit: { steps: [{ effect: "shake" }, { effect: "badge" }, { effect: "sound" }] },
    });
    gates.reducedMotion = true;
    director.play("hit", {});
    expect(effectsOf(played)).toEqual(["badge", "sound"]);
    expect(played[0].context.reduced).toBe(true);
  });

  it("should skip haptics when the tuning, the setting or reduced motion turns them off", () => {
    const book = { hit: { steps: [{ effect: "haptic" }] } };
    const off = setup(book, { haptics: false });
    off.director.play("hit", {});
    expect(off.played).toHaveLength(0);
    const reduced = setup(book);
    reduced.gates.reducedMotion = true;
    reduced.director.play("hit", {});
    expect(reduced.played).toHaveLength(0);
    const on = setup(book);
    on.director.play("hit", {});
    expect(effectsOf(on.played)).toEqual(["haptic"]);
  });

  it("should allow at most the flash limit of screen flashes per second when events repeat", () => {
    const { director, played, clock } = setup({
      boom: { steps: [{ effect: "flash", target: "screen" }] },
    });
    for (let index = 0; index < JUICE_LIMITS.screenFlashesPerSecond + 2; index += 1)
      director.play("boom", {});
    expect(played).toHaveLength(JUICE_LIMITS.screenFlashesPerSecond);
    clock.advance(1000);
    director.play("boom", {});
    expect(played).toHaveLength(JUICE_LIMITS.screenFlashesPerSecond + 1);
  });
});

describe("createJuiceDirector limits and options", () => {
  it("should ignore an event during its cooldown when the recipe sets one", () => {
    const { director, played, clock } = setup({
      tap: { cooldownMs: 100, steps: [{ effect: "sound" }] },
    });
    director.play("tap", {});
    director.play("tap", {});
    clock.advance(100);
    director.play("tap", {});
    expect(played).toHaveLength(2);
  });

  it("should cancel the oldest run when more runs than the limit are alive", () => {
    const { director, cancels } = setup({ hit: { steps: [{ effect: "shake" }] } });
    for (let index = 0; index <= JUICE_LIMITS.concurrentRuns; index += 1) director.play("hit", {});
    expect(cancels).toEqual(["shake"]);
  });

  it("should cancel the runs of a tag when stop is called with that tag", () => {
    const { director, cancels, played, clock } = setup({
      alarm: { tag: "alarm", steps: [{ effect: "shake" }, { effect: "badge", at: 500 }] },
    });
    director.play("alarm", {});
    director.stop("alarm");
    clock.advance(500);
    expect(cancels).toEqual(["shake"]);
    expect(effectsOf(played)).toEqual(["shake"]);
  });

  it("should skip a step when its chance roll fails", () => {
    const { director, played } = setup({
      hit: {
        steps: [
          { effect: "sound", chance: 0.4 },
          { effect: "badge", chance: 0.6 },
        ],
      },
    });
    director.play("hit", {});
    expect(effectsOf(played)).toEqual(["badge"]);
  });

  it("should scale the intensity by the payload strength when a strength is given", () => {
    const { director, played } = setup(
      { hit: { steps: [{ effect: "shake" }] } },
      { intensity: 0.5 }
    );
    director.play("hit", { strength: 2 });
    expect(played[0].context.intensity).toBe(1);
  });

  it("should do nothing when the event or its effect is unknown", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { director, played } = setup({ hit: { steps: [{ effect: "nope" }] } });
    director.play("missing", {});
    director.play("hit", {});
    expect(played).toHaveLength(0);
    warn.mockRestore();
  });

  it("should fill templates from the payload vars when a step resolves its target", () => {
    const { director, played } = setup({ hit: { steps: [{ effect: "badge" }] } });
    director.play("hit", { vars: { meter: "users" } });
    expect(played[0].context.fill("meter:{meter}")).toBe("meter:users");
    expect(played[0].context.resolve("meter:{meter}")).toBeNull();
    expect(played[0].context.resolve("screen")?.isScreen).toBe(true);
  });
});
