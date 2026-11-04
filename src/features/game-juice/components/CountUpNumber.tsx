import { useRef } from "react";
import { useCountUp } from "@/features/game-juice/hooks/useCountUp";

export interface CountUpNumberProps {
  value: number;
  /** Snap to the new value without counting (e.g. after a news post). */
  instant?: boolean;
  className?: string;
}

/** A number that counts from its previous value to the new one; instant under reduced motion. */
export const CountUpNumber = ({ value, instant = false, className }: CountUpNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, instant);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
};
