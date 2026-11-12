import { useEffect } from "react";
import { emitJuice } from "@/features/game-juice/services/gameJuiceRuntime";
import { pressedControl } from "@/features/game-juice/services/juicePress";

/**
 * Every press of a button or link in the app plays `ui.press` on that control (game-juice D15),
 * so no screen has to wire its own tap. Only real presses (`isTrusted`: mouse, touch, Enter or
 * Space), never a script's `.click()` (the share download's hidden link). Bubble phase, so a
 * click that dnd-kit swallows after a drag (capture `stopPropagation`) doesn't tap. Areas with
 * their own juice opt out with `data-juice-press="off"`.
 */
export function useJuicePress(): void {
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      if (!event.isTrusted) return;
      const control = pressedControl(event.composedPath());
      if (control) emitJuice("ui.press", { origin: control });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
