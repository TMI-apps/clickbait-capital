import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRetainedValue } from "@/shared/hooks/useRetainedValue";

describe("useRetainedValue", () => {
  it("should keep the last value when the input turns null", () => {
    const { result, rerender } = renderHook(({ value }) => useRetainedValue(value), {
      initialProps: { value: "a" as string | null },
    });
    rerender({ value: null });
    expect(result.current).toBe("a");
  });

  it("should follow a new value when the input changes", () => {
    const { result, rerender } = renderHook(({ value }) => useRetainedValue(value), {
      initialProps: { value: "a" as string | null },
    });
    rerender({ value: "b" });
    expect(result.current).toBe("b");
  });
});
