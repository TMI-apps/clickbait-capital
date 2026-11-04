import { useRef } from "react";
import { useCountUp } from "@/features/game-juice/hooks/useCountUp";

export interface CountUpNumberProps {
  value: number;
  className?: string;
}

/** A number that counts from its previous value to the new one; instant under reduced motion. */
export const CountUpNumber = ({ value, className }: CountUpNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
};
