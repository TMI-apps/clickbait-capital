import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { getMotionStore } from "@/features/game-settings/api";
import { useActionJuice } from "@/features/game-juice/hooks/useActionJuice";
import type { JuiceAction } from "@/features/game-juice/types/juice.types";

/*
 * The game-settings motion store is a page singleton that reads the OS setting when it is
 * created. This file pretends the OS asks for reduced motion before the store's first use, so
 * each test checks how the in-app Beweging choice overrides (or follows) it.
 */
const originalMatchMedia = window.matchMedia;
const osPrefersReducedMotion = (): void => {
  const lightOs = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      ...lightOs(query),
      matches: query.includes("prefers-reduced-motion"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as MediaQueryList;
};

const METERS = [
  { key: "revenue" as const, value: 50, delta: 0 },
  { key: "users" as const, value: 62, delta: 12 },
  { key: "reputation" as const, value: 49, delta: -1 },
];

/** Mounts the board's juice before any action, then plays one viral card. */
const playViral = () => {
  const hook = renderHook(
    ({ action, key }: { action: JuiceAction | null; key: number }) =>
      useActionJuice({ action, meters: METERS, key }),
    { initialProps: { action: null as JuiceAction | null, key: 0 } }
  );
  hook.rerender({ action: "viral", key: 1 });
  return hook.result.current;
};

describe("useActionJuice motion setting", () => {
  beforeEach(() => {
    osPrefersReducedMotion();
  });

  afterEach(() => {
    act(() => getMotionStore().reset());
    window.matchMedia = originalMatchMedia;
  });

  it("should throw particles when the player chooses Volledig even though the OS prefers reduced motion", () => {
    act(() => getMotionStore().setPreference("full"));
    const juice = playViral();

    expect(juice.burst?.paths.length).toBe(12);
  });

  it("should follow the OS and throw no particles but keep the accent when the choice is Systeem", () => {
    const juice = playViral();

    expect(juice.burst).toBeNull();
    expect(juice.plan?.accents).toEqual({ users: "flames" });
  });

  it("should throw no particles but keep the accent when the player chooses Verminderd", () => {
    act(() => getMotionStore().setPreference("reduced"));
    const juice = playViral();

    expect(juice.burst).toBeNull();
    expect(juice.plan?.accents).toEqual({ users: "flames" });
  });
});
