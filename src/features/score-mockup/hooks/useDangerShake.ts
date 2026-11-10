import { useEffect, useRef } from "react";
import type { ReputationLevel } from "@/features/score-mockup/types/scoreMockup.types";

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(6px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(0)" },
];

/** Shakes the element on every turn spent in the danger zone (not under reduced motion). */
export function useDangerShake<T extends HTMLElement>(level: ReputationLevel, turn: number) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (level !== "danger" || !element?.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    element.animate(SHAKE, { duration: 450, easing: "ease-in-out" });
  }, [level, turn]);
  return ref;
}
