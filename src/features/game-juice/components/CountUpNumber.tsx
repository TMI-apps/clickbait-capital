import { useRef, useState } from "react";
import { useCountUp } from "@/features/game-juice/hooks/useCountUp";

export interface CountUpNumberProps {
  value: number;
  /** Snap to the new value without counting (e.g. after a news post). */
  instant?: boolean;
  /** Value to count from on mount (a reveal counts up from 0); default: show `value` at once. */
  from?: number;
  className?: string;
}

/** A number that counts from its previous value to the new one; instant under reduced motion. */
export const CountUpNumber = ({ value, instant = false, from, className }: CountUpNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, { instant, from });
  // Initial text only: later frames are written by the hook through the ref.
  const [initial] = useState(from ?? value);
  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  );
};
