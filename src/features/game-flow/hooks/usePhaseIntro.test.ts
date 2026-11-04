import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePhaseIntro } from "@/features/game-flow/hooks/usePhaseIntro";

describe("usePhaseIntro", () => {
  it("should ask for each phase intro once when phases start", () => {
    const { result, rerender } = renderHook(({ phase }) => usePhaseIntro(phase), {
      initialProps: { phase: 1 },
    });
    expect(result.current.pendingPhase).toBe(1);

    act(() => result.current.dismiss());
    expect(result.current.pendingPhase).toBeNull();

    rerender({ phase: 2 });
    expect(result.current.pendingPhase).toBe(2);
    act(() => result.current.dismiss());
    rerender({ phase: 2 });
    expect(result.current.pendingPhase).toBeNull();
  });

  it("should show the phase 1 intro again when the run is reset", () => {
    const { result, rerender } = renderHook(({ phase }) => usePhaseIntro(phase), {
      initialProps: { phase: 3 },
    });
    act(() => result.current.dismiss());
    act(() => result.current.reset());
    rerender({ phase: 1 });
    expect(result.current.pendingPhase).toBe(1);
  });
});
