import { useEffect, type RefObject } from "react";
import { readDurationToken } from "@/features/game-juice/services/motionTokens";

/** A light horizontal shake; small offsets so text stays readable (design § 5: "licht"). */
const SHAKE_FRAMES: Keyframe[] = [
  { transform: "translate3d(0, 0, 0)" },
  { transform: "translate3d(-5px, 1px, 0)" },
  { transform: "translate3d(4px, -1px, 0)" },
  { transform: "translate3d(-3px, 0, 0)" },
  { transform: "translate3d(2px, 1px, 0)" },
  { transform: "translate3d(0, 0, 0)" },
];

/**
 * Shakes the element once each time `key` changes while `active` (Web Animations API, so no
 * class toggling or re-render). Transform only; skipped when the element can't animate.
 */
export function useShake(ref: RefObject<HTMLElement | null>, key: number, active: boolean): void {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element || typeof element.animate !== "function") return;
    const animation = element.animate(SHAKE_FRAMES, {
      duration: readDurationToken("--duration-juice-shake", 360),
      easing: "ease-out",
    });
    return () => animation.cancel();
  }, [ref, key, active]);
}
