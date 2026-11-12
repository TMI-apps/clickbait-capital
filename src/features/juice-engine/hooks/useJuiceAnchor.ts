import { useCallback } from "react";
import {
  registerJuiceAnchor,
  registerJuiceStage,
} from "@/features/juice-engine/services/juiceAnchors";

/**
 * Ref callback that makes an element a named juice target (juice-core D4), e.g.
 * `<div ref={useJuiceAnchor("meter:users")}>`. Recipes target it by name; it unregisters on
 * unmount (StrictMode-safe).
 */
export function useJuiceAnchor(
  name: string
): (element: Element | null) => (() => void) | undefined {
  return useCallback(
    (element: Element | null) => (element ? registerJuiceAnchor(name, element) : undefined),
    [name]
  );
}

/** Ref callback that registers the overlay stage (used by `JuiceStage`). */
export function useJuiceStageRef(): (element: HTMLElement | null) => (() => void) | undefined {
  return useCallback(
    (element: HTMLElement | null) => (element ? registerJuiceStage(element) : undefined),
    []
  );
}
