import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { getMotionStore } from "@/features/game-settings/api";
import {
  GAME_JUICE_RECIPES,
  GAME_JUICE_STORAGE_KEY,
  getGameJuiceTuning,
} from "@/features/game-juice/api";
import { GameJuiceRoot } from "@/features/game-juice/api/root";
import type { ParticlesStep, SoundStep } from "@/features/juice-effects/api";
import { JuiceInspector } from "@/features/juice-inspector/components/JuiceInspector";
import { installAnimateStub, type AnimateStubController } from "../../../../tests/test-utils";

const play = vi.fn();
vi.mock("@/features/game-audio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/game-audio/api")>()),
  useSoundEffects: () => ({ play, muted: false, setMuted: vi.fn(), toggleMuted: vi.fn() }),
}));

/** Expected values come from the shipped recipe (testing.md: SSOT, not re-derived). */
const VIRAL = GAME_JUICE_RECIPES["card.played"].variants?.viral ?? [];
const viralParticles = VIRAL.find((step): step is ParticlesStep => step.effect === "particles");
const viralSound = VIRAL.find((step): step is SoundStep => step.effect === "sound");
const viralParticleIndex = VIRAL.findIndex((step) => step.effect === "particles");

let stub: AnimateStubController;
beforeEach(() => {
  stub = installAnimateStub();
  play.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  stub.finishAll();
  stub.restore();
  getMotionStore().reset();
  getGameJuiceTuning().reset();
});

const renderInspector = () =>
  render(
    <>
      <GameJuiceRoot />
      <JuiceInspector />
    </>
  );

const particleCount = (): number => document.querySelectorAll("[data-juice-particle]").length;

const triggerViral = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "card.played · viral" }));
};

/** Selects viral (playing it once) and types a new particle count into its step editor. */
const setViralParticleCount = (value: string): void => {
  triggerViral();
  stub.finishAll();
  const step = screen.getByRole("group", { name: `Stap ${viralParticleIndex + 1}: particles` });
  fireEvent.change(within(step).getByRole("spinbutton", { name: "Aantal" }), {
    target: { value },
  });
};

describe("JuiceInspector", () => {
  it("should play the viral card recipe on the stage when card.played viral is triggered", () => {
    renderInspector();
    triggerViral();
    expect(particleCount()).toBe(viralParticles?.count);
    expect(play).toHaveBeenCalledWith(viralSound?.id, expect.any(Object));
    const board = document.querySelector('[data-inspector-anchor="board"]');
    expect(stub.calls.some((call) => call.element === board)).toBe(true);
  });

  it("should keep only sound and static steps when motion is reduced", () => {
    renderInspector();
    act(() => getMotionStore().setPreference("reduced"));
    triggerViral();
    expect(particleCount()).toBe(0);
    expect(play).toHaveBeenCalledWith(viralSound?.id, expect.any(Object));
    expect(document.querySelector("[data-juice-badge]")).not.toBeNull();
  });

  it("should apply an edited step value on the next run and keep it when the page reloads", () => {
    vi.useFakeTimers();
    const { unmount } = renderInspector();
    setViralParticleCount("4");
    triggerViral();
    expect(particleCount()).toBe(4);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(window.localStorage.getItem(GAME_JUICE_STORAGE_KEY)).toContain('"count":4');
    unmount();
    stub.finishAll();
    getGameJuiceTuning().reload();
    renderInspector();
    triggerViral();
    expect(particleCount()).toBe(4);
  });
});
