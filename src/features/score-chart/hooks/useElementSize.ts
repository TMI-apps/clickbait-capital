import { useEffect, useState } from "react";
import type { RefObject } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * The rendered size of an element in CSS pixels, kept current with a `ResizeObserver`; zeros
 * until the first measurement (or where `ResizeObserver` is missing, e.g. jsdom).
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const measure = (width: number, height: number): void =>
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      );
    const box = element.getBoundingClientRect();
    measure(Math.round(box.width), Math.round(box.height));
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) measure(Math.round(rect.width), Math.round(rect.height));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
