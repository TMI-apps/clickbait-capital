import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JUICE_LIMITS } from "@/features/juice-engine/api";
import {
  enterEffect,
  popEffect,
  shakeEffect,
  timeWarpEffect,
  traceEffect,
  zoomEffect,
} from "@/features/juice-effects/services/motionEffects";
import {
  createJuiceTestContext,
  installAnimateStub,
  type AnimateStubController,
} from "../../../../tests/test-utils";

let stub: AnimateStubController;
beforeEach(() => {
  stub = installAnimateStub();
});
afterEach(() => {
  stub.restore();
  vi.useRealTimers();
});

const offsets = (): number[] =>
  stub.calls[0].keyframes.map((frame) =>
    Math.abs(Number(/translate3d\((-?[\d.]+)px/.exec(String(frame.transform))?.[1] ?? 0))
  );

describe("motion effects", () => {
  it("should restore the original rate when two time warps overlap", () => {
    vi.useFakeTimers();
    const card = document.createElement("div");
    const context = createJuiceTestContext({ anchors: { card } });
    popEffect.run({ effect: "pop", target: "card", scale: 1.2, duration: 300 }, context);
    const animation = stub.calls[0].animation;
    timeWarpEffect.run({ effect: "timeWarp", rate: 0, duration: 100 }, context);
    vi.advanceTimersByTime(50);
    timeWarpEffect.run({ effect: "timeWarp", rate: 0.5, duration: 100 }, context);
    vi.advanceTimersByTime(50);
    expect(animation.playbackRate).toBe(0.5);
    vi.advanceTimersByTime(50);
    expect(animation.playbackRate).toBe(1);
  });

  it("should shake the target harder when the intensity is higher", () => {
    const board = document.createElement("div");
    shakeEffect.run(
      { effect: "shake", target: "board", strength: 5, duration: 360 },
      createJuiceTestContext({ anchors: { board } })
    );
    const soft = Math.max(...offsets());
    stub.calls.length = 0;
    shakeEffect.run(
      { effect: "shake", target: "board", strength: 5, duration: 360 },
      createJuiceTestContext({ anchors: { board }, overrides: { intensity: 2 } })
    );
    expect(Math.max(...offsets())).toBe(soft * 2);
    expect(stub.calls[0].element).toBe(board);
    expect(stub.calls[0].options.composite).toBe("add");
  });

  it("should scale durations by the motion scale when it is not 1", () => {
    const card = document.createElement("div");
    popEffect.run(
      { effect: "pop", target: "card", scale: 1.2, duration: 300 },
      createJuiceTestContext({ anchors: { card }, overrides: { motionScale: 2 } })
    );
    expect(stub.calls[0].options.duration).toBe(600);
  });

  it("should open a clip from the left edge when a trace plays", () => {
    const tail = document.createElement("div");
    traceEffect.run(
      { effect: "trace", target: "tail", duration: 400 },
      createJuiceTestContext({ anchors: { tail } })
    );
    const [from, to] = stub.calls[0].keyframes.map((frame) => String(frame.clipPath));
    expect(stub.calls[0].element).toBe(tail);
    expect(from).toContain(" 100% ");
    expect(to).not.toContain("100%");
    expect(stub.calls[0].options.fill).toBe("backwards");
  });

  it("should do nothing when the target is not on screen", () => {
    zoomEffect.run(
      { effect: "zoom", target: "chart", scale: 1.05, duration: 400 },
      createJuiceTestContext()
    );
    expect(stub.calls).toHaveLength(0);
  });

  it("should slow the juice's own animations and restore them when the time warp ends", () => {
    vi.useFakeTimers();
    const card = document.createElement("div");
    const context = createJuiceTestContext({ anchors: { card } });
    popEffect.run({ effect: "pop", target: "card", scale: 1.2, duration: 300 }, context);
    const animation = stub.calls[0].animation;
    timeWarpEffect.run({ effect: "timeWarp", rate: 0, duration: 9999 }, context);
    expect(animation.playbackRate).toBe(0);
    vi.advanceTimersByTime(JUICE_LIMITS.timeWarpMs);
    expect(animation.playbackRate).toBe(1);
  });

  it("should start the entrance from the step's offset and scale when it plays", () => {
    const post = document.createElement("div");
    enterEffect.run(
      { effect: "enter", target: "post", dy: -12, scale: 0.9, duration: 420, easing: "linear" },
      createJuiceTestContext({ anchors: { post } })
    );
    expect(stub.calls[0].keyframes[0]).toEqual({
      opacity: 0,
      transform: "translateY(-12px) scale(0.9)",
    });
    expect(stub.calls[0].options).toMatchObject({ easing: "linear", fill: "backwards" });
  });
});
