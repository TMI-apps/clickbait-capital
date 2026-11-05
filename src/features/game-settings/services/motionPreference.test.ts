import { describe, expect, it, vi } from "vitest";
import {
  applyMotionToDocument,
  createMotionStore,
  resolveReducedMotion,
  type MotionStoreDeps,
} from "./motionPreference";

const makeDeps = (overrides: Partial<MotionStoreDeps> = {}) => {
  let onSystemChange = (): void => undefined;
  const deps: MotionStoreDeps = {
    read: () => null,
    write: vi.fn(),
    systemReduces: () => false,
    watchSystem: (onChange) => {
      onSystemChange = onChange;
      return () => undefined;
    },
    apply: vi.fn(),
    ...overrides,
  };
  return { deps, fireSystemChange: () => onSystemChange() };
};

describe("resolveReducedMotion", () => {
  it("should follow the OS when the preference is system", () => {
    expect(resolveReducedMotion("system", true)).toBe(true);
    expect(resolveReducedMotion("system", false)).toBe(false);
  });

  it("should override the OS when the preference is reduced or full", () => {
    expect(resolveReducedMotion("reduced", false)).toBe(true);
    expect(resolveReducedMotion("full", true)).toBe(false);
  });
});

describe("createMotionStore", () => {
  it("should start on system when nothing valid is stored", () => {
    const { deps } = makeDeps({ read: () => "bogus" });
    expect(createMotionStore(deps).getPreference()).toBe("system");
  });

  it("should restore the stored choice when it is valid", () => {
    const { deps } = makeDeps({ read: () => "reduced" });
    const store = createMotionStore(deps);
    expect(store.getPreference()).toBe("reduced");
    expect(store.getReducedMotion()).toBe(true);
    expect(deps.apply).toHaveBeenCalledWith(true, "reduced");
  });

  it("should store, apply and notify when the preference changes", () => {
    const { deps } = makeDeps();
    const store = createMotionStore(deps);
    const listener = vi.fn();
    store.subscribe(listener);

    store.setPreference("reduced");

    expect(deps.write).toHaveBeenCalledWith("reduced");
    expect(deps.apply).toHaveBeenLastCalledWith(true, "reduced");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should follow an OS change when the preference is system", () => {
    let systemReduces = false;
    const { deps, fireSystemChange } = makeDeps({ systemReduces: () => systemReduces });
    const store = createMotionStore(deps);

    systemReduces = true;
    fireSystemChange();

    expect(store.getReducedMotion()).toBe(true);
  });

  it("should go back to system and forget the choice when reset", () => {
    const { deps } = makeDeps({ read: () => "full", systemReduces: () => true });
    const store = createMotionStore(deps);

    store.reset();

    expect(store.getPreference()).toBe("system");
    expect(store.getReducedMotion()).toBe(true);
    expect(deps.write).toHaveBeenCalledWith(null);
  });
});

describe("applyMotionToDocument", () => {
  it("should shorten duration tokens when the player chose reduced", () => {
    applyMotionToDocument(true, "reduced");
    const root = document.documentElement;
    expect(root.dataset.motion).toBe("reduced");
    expect(root.style.getPropertyValue("--duration-normal")).toBe("0.01ms");
  });

  it("should leave durations to the CSS media query when following the system", () => {
    applyMotionToDocument(true, "system");
    expect(document.documentElement.style.getPropertyValue("--duration-normal")).toBe("");
    applyMotionToDocument(false, "full");
    expect(document.documentElement.dataset.motion).toBe("full");
  });
});
