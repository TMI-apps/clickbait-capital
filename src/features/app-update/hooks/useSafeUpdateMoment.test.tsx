import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { useSafeUpdateMoment } from "@/features/app-update/hooks/useSafeUpdateMoment";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/spel"]}>{children}</MemoryRouter>
);

const renderPolicy = (updateReady: boolean) => {
  const applyUpdate = vi.fn();
  const view = renderHook(
    ({ ready }: { ready: boolean }) => {
      useSafeUpdateMoment({ updateReady: ready, applyUpdate });
      return useNavigate();
    },
    { wrapper, initialProps: { ready: updateReady } }
  );
  return { applyUpdate, ...view };
};

describe("useSafeUpdateMoment", () => {
  it("should apply the update when it is ready before the player's first input", () => {
    const { applyUpdate } = renderPolicy(true);
    expect(applyUpdate).toHaveBeenCalledOnce();
  });

  it("should apply the update when it arrives later but the player has not touched the app", () => {
    const { applyUpdate, rerender } = renderPolicy(false);
    rerender({ ready: true });
    expect(applyUpdate).toHaveBeenCalledOnce();
  });

  it("should not apply the update when the player has interacted on the same route", () => {
    const { applyUpdate, rerender } = renderPolicy(false);
    fireEvent.pointerDown(window);
    rerender({ ready: true });
    fireEvent.keyDown(window, { key: "a" });
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("should apply the waiting update when the player moves to another route", () => {
    const { applyUpdate, rerender, result } = renderPolicy(false);
    fireEvent.pointerDown(window);
    rerender({ ready: true });
    act(() => {
      void result.current("/");
    });
    expect(applyUpdate).toHaveBeenCalledOnce();
  });

  it("should do nothing when the route changes without a waiting update", () => {
    const { applyUpdate, result } = renderPolicy(false);
    fireEvent.pointerDown(window);
    act(() => {
      void result.current("/");
    });
    expect(applyUpdate).not.toHaveBeenCalled();
  });
});
