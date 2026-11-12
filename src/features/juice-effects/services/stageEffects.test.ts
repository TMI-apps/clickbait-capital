import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JUICE_LIMITS } from "@/features/juice-engine/api";
import {
  calloutEffect,
  floaterEffect,
  particleRoom,
  particlesEffect,
} from "@/features/juice-effects/services/stageEffects";
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
  stub.finishAll();
  stub.restore();
  document.body.innerHTML = "";
});

const particles = (stage: HTMLElement): number =>
  stage.querySelectorAll("[data-juice-particle]").length;

describe("stage effects", () => {
  it("should throw count times intensity particles when the stage has room", () => {
    const context = createJuiceTestContext({ overrides: { intensity: 0.5 } });
    particlesEffect.run(
      { effect: "particles", glyphs: "🔥😱😡", count: 12, duration: 760 },
      context
    );
    expect(particles(context.stage)).toBe(6);
  });

  it("should never pass the live particle cap when bursts pile up", () => {
    const context = createJuiceTestContext({ overrides: { intensity: 2 } });
    for (let burst = 0; burst < 4; burst += 1)
      particlesEffect.run({ effect: "particles", glyphs: "🪙", count: 20, duration: 760 }, context);
    expect(particles(context.stage)).toBe(JUICE_LIMITS.liveParticles);
    expect(particleRoom()).toBe(0);
  });

  it("should free the particles when they land", () => {
    const context = createJuiceTestContext();
    particlesEffect.run({ effect: "particles", glyphs: "🎉", count: 5, duration: 760 }, context);
    stub.finishAll();
    expect(particles(context.stage)).toBe(0);
    expect(particleRoom()).toBe(JUICE_LIMITS.liveParticles);
  });

  it("should add a soft glow behind the burst when the step names a glow colour", () => {
    const context = createJuiceTestContext();
    particlesEffect.run(
      { effect: "particles", glyphs: "🔥", count: 2, duration: 760, glow: "type-viral" },
      context
    );
    expect(context.stage.childElementCount).toBe(3);
  });

  it("should show the floater text without rising when it plays in its reduced form", () => {
    const meter = document.createElement("div");
    const context = createJuiceTestContext({
      anchors: { meter },
      overrides: { reduced: true, fill: () => "+€ 2.000" },
    });
    floaterEffect.run(
      {
        effect: "floater",
        target: "meter",
        text: "{text}",
        color: "success",
        rise: 40,
        duration: 900,
      },
      context
    );
    expect(context.stage.querySelector('[data-juice-floater="+€ 2.000"]')).not.toBeNull();
    expect(
      String(stub.calls[0].keyframes[stub.calls[0].keyframes.length - 1]?.transform)
    ).toContain("- 0px");
  });

  it("should keep a callout up for at least the reading time when its duration is shorter", () => {
    const context = createJuiceTestContext({ overrides: { fill: () => "Doel gehaald!" } });
    calloutEffect.run(
      {
        effect: "callout",
        target: "screen",
        text: "Doel gehaald!",
        color: "success",
        duration: 200,
      },
      context
    );
    expect(stub.calls[0].options.duration).toBe(JUICE_LIMITS.minReadMs);
  });
});
