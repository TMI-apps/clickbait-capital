import { useCallback, type KeyboardEvent } from "react";

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Arrow keys move focus between the buttons inside a group (wrapping at the ends), so a
 * row of choices is playable with arrows + Enter / Space. `itemSelector` picks the buttons.
 */
export function useRovingFocus(itemSelector: string): {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const step = NEXT_KEYS.has(event.key) ? 1 : PREVIOUS_KEYS.has(event.key) ? -1 : 0;
      if (step === 0) return;
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(itemSelector));
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.findIndex((item) => item === document.activeElement);
      const next = current === -1 ? 0 : (current + step + items.length) % items.length;
      items[next].focus();
    },
    [itemSelector]
  );
  return { onKeyDown };
}
