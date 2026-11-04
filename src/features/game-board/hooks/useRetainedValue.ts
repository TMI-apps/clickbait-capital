import { useState } from "react";

/**
 * Returns `value`, or the last non-null value once it turns null. Lets a dialog keep its
 * content while it animates closed instead of fading out as an empty box.
 */
export function useRetainedValue<T>(value: T | null): T | null {
  const [kept, setKept] = useState<T | null>(value);
  if (value !== null && value !== kept) {
    setKept(value);
  }
  return value ?? kept;
}
