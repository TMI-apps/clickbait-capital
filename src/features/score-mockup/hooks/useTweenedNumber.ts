import { useEffect, useRef, useState } from "react";
import { formatCount, formatMoney } from "@/features/score-mockup/services/scoreFormat";
import type { ScoreFormat } from "@/features/score-mockup/types/scoreMockup.types";

/**
 * A number that glides to its target over `durationMs` (ease-out), so the score moves
 * gradually instead of jumping. Snaps under reduced motion.
 */
export function useTweenedNumber(target: number, durationMs = 1200): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || from === target) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      shownRef.current = from + (target - from) * eased;
      setShown(shownRef.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}

/** The tweened number, written as a count ("2,4 mln") or money ("€ 120.000"). */
export function useTweenedText(target: number, format: ScoreFormat, durationMs?: number): string {
  const shown = useTweenedNumber(target, durationMs);
  return format === "money" ? formatMoney(shown) : formatCount(shown);
}
