import { useEffect, useRef, type RefObject } from "react";
import { useMotionPreference } from "@/features/game-juice/hooks/useMotionPreference";
import { readDurationToken } from "@/features/juice-engine/api";

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Counts the element's text from the previous value to `value` (slot-machine feel). Frames
 * write `textContent` through the ref, so React renders once per change, not per frame.
 * Reduced motion or `instant` writes the new value at once. `from` sets the first value to count
 * from (e.g. 0 for a reveal); by default the first value shows as is.
 */
export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  value: number,
  { instant = false, from }: { instant?: boolean; from?: number } = {}
): void {
  const shown = useRef(from ?? value);
  const { reduced } = useMotionPreference();

  useEffect(() => {
    const element = ref.current;
    const from = shown.current;
    const write = (next: number): void => {
      shown.current = next;
      if (element) element.textContent = String(next);
    };
    const duration = reduced || instant ? 0 : readDurationToken("--duration-count", 650);
    if (from === value || duration < 1 || typeof requestAnimationFrame !== "function") {
      write(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      write(Math.round(from + (value - from) * easeOut(t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      write(value);
    };
  }, [ref, value, reduced, instant]);
}
