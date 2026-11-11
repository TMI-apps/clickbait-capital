import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * The rendered width of an element in CSS pixels, kept current with a `ResizeObserver`; 0 until
 * the first measurement (or where `ResizeObserver` is missing, e.g. jsdom).
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next !== undefined) setWidth(Math.round(next));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
