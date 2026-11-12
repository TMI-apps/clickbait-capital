import { useLayoutEffect, useRef } from "react";
import { emitJuice } from "@/features/game-juice/services/gameJuiceRuntime";
import type {
  JuiceMeterKey,
  JuiceOptionVariant,
} from "@/features/game-juice/types/gameJuiceEvents.types";

/** One outcome row as the juice reads it. */
export interface OutcomeRow {
  meter: JuiceMeterKey;
  delta: number;
}

/** The juice anchor of an outcome row (`outcome:users`). */
export const outcomeRowAnchor = (meter: JuiceMeterKey): string => `outcome:${meter}`;

/**
 * Plays an event outcome's juice once, when its rows appear (juice-migrate D8): the accent of the
 * option's kind (`event.outcome`) and each row's entrance and gain / loss flash (`outcome.row`,
 * `dull` for journalism or no change). Layout effect, so the rows enter before the first paint;
 * the ref guard keeps a StrictMode double mount from playing it twice.
 */
export function useOutcomeJuice(rows: OutcomeRow[], kind: JuiceOptionVariant | undefined): void {
  const played = useRef(false);
  useLayoutEffect(() => {
    if (played.current) return;
    played.current = true;
    if (kind) emitJuice("event.outcome", { variant: kind });
    for (const { meter, delta } of rows) {
      const dull = kind === "journalism" || delta === 0;
      emitJuice("outcome.row", {
        variant: dull ? "dull" : delta > 0 ? "gain" : "loss",
        vars: { row: outcomeRowAnchor(meter) },
      });
    }
    // Plays once per mounted outcome; a new outcome mounts a new component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
