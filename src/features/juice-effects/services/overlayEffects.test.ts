import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JUICE_LIMITS } from "@/features/juice-engine/api";
import {
  badgeEffect,
  flashEffect,
  glowEffect,
  tintEffect,
  tokenColor,
} from "@/features/juice-effects/services/overlayEffects";
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
  document.body.innerHTML = "";
});

const peakOpacity = (): number =>
  Math.max(...stub.calls[0].keyframes.map((frame) => Number(frame.opacity ?? 0)));

describe("overlay effects", () => {
  it("should cap a screen flash at the screen opacity limit when the step and intensity ask for more", () => {
    const context = createJuiceTestContext({ overrides: { intensity: 2 } });
    flashEffect.run(
      { effect: "flash", target: "screen", color: "success", opacity: 5, duration: 300 },
      context
    );
    expect(peakOpacity()).toBe(JUICE_LIMITS.screenOpacity);
  });

  it("should count only screen-wide washes as flashes when the guard asks", () => {
    expect(flashEffect.flashes({ effect: "flash", target: "screen" })).toBe(true);
    expect(flashEffect.flashes({ effect: "flash", target: "meter:users" })).toBe(false);
    expect(tintEffect.flashes({ effect: "tint", target: "screen" })).toBe(true);
    expect(glowEffect.flashes({ effect: "glow", target: "screen" })).toBe(true);
  });

  it("should cap a flash at the screen opacity and spend a flash token when its target covers most of the screen", () => {
    const board = document.createElement("div");
    let claimed = 0;
    const context = createJuiceTestContext({
      anchors: { board },
      overrides: {
        resolve: (ref) =>
          ref === "screen"
            ? { element: null, rect: { x: 0, y: 0, width: 100, height: 100 }, isScreen: true }
            : { element: board, rect: { x: 0, y: 0, width: 80, height: 80 }, isScreen: false },
        claimScreenFlash: () => {
          claimed += 1;
          return claimed === 1;
        },
      },
    });
    const step = {
      effect: "flash",
      target: "board",
      color: "success",
      opacity: 0.6,
      duration: 300,
    };
    flashEffect.run(step, context);
    flashEffect.run(step, context);
    expect(peakOpacity()).toBe(JUICE_LIMITS.screenOpacity);
    expect(stub.calls).toHaveLength(1);
  });

  it("should beat once and no faster than the screen beat when a glow covers the screen", () => {
    const context = createJuiceTestContext();
    glowEffect.run(
      { effect: "glow", target: "screen", color: "type-ad", times: 6, duration: 50 },
      context
    );
    expect(stub.calls[0].options.iterations).toBe(1);
    expect(stub.calls[0].options.duration).toBe(JUICE_LIMITS.screenBeatMs);
  });

  it("should remove its node from the stage when the animation finishes", () => {
    const tile = document.createElement("div");
    const context = createJuiceTestContext({ anchors: { tile } });
    flashEffect.run(
      { effect: "flash", target: "tile", color: "success", opacity: 0.2, duration: 300 },
      context
    );
    expect(context.stage.childElementCount).toBe(1);
    stub.finishAll();
    expect(context.stage.childElementCount).toBe(0);
  });

  it("should remove its node when the step is cancelled", () => {
    const tile = document.createElement("div");
    const context = createJuiceTestContext({ anchors: { tile } });
    const cancel = glowEffect.run(
      { effect: "glow", target: "tile", color: "type-ad", times: 2, duration: 300 },
      context
    );
    cancel?.();
    expect(context.stage.childElementCount).toBe(0);
  });

  it("should skip the step when its target is missing", () => {
    const context = createJuiceTestContext();
    tintEffect.run(
      { effect: "tint", target: "nowhere", color: "warning", opacity: 0.2, duration: 300 },
      context
    );
    expect(context.stage.childElementCount).toBe(0);
  });

  it("should show the badge without movement when it plays in its reduced form", () => {
    const tile = document.createElement("div");
    const context = createJuiceTestContext({ anchors: { tile }, overrides: { reduced: true } });
    badgeEffect.run({ effect: "badge", target: "tile", glyph: "🔥", duration: 1000 }, context);
    expect(
      context.stage.querySelector("[data-juice-badge]")?.getAttribute("data-juice-badge")
    ).toBe("🔥");
    expect(stub.calls[0].keyframes.some((frame) => frame.transform)).toBe(false);
  });

  it("should map a token name to its CSS variable and reject anything else when resolving a colour", () => {
    expect(tokenColor("type-viral")).toBe("var(--type-viral)");
    expect(tokenColor("red; background: url(x)")).toBe("currentColor");
  });
});
