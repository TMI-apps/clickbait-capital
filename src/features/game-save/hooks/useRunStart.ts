import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { readSavedRun } from "@/features/game-save/services/savedRunStorage";
import type { RunStart, SavedRun } from "@/features/game-save/types/savedRun.types";

/** Router state the start screen passes to `/spel` when the player already chose. */
export interface RunStartState {
  run: "resume" | "new";
}

const chosenStart = (state: unknown): RunStartState["run"] | null => {
  if (typeof state !== "object" || state === null || !("run" in state)) return null;
  return state.run === "resume" || state.run === "new" ? state.run : null;
};

export interface RunStartChoice {
  start: RunStart;
  /** The save read when `/spel` opened; only set while it can still be resumed. */
  savedRun: SavedRun | null;
  resume: () => void;
  startNew: () => void;
}

/**
 * Decides how `/spel` starts (local-save D4): without a save a new run; with one, the choice
 * the start screen passed along, else ask. The passed choice is consumed (history entry
 * replaced), so a reload with a save asks again instead of repeating "Nieuw spel".
 */
export function useRunStart(): RunStartChoice {
  const location = useLocation();
  const navigate = useNavigate();
  const [savedRun] = useState(readSavedRun);
  const [start, setStart] = useState<RunStart>(() => {
    if (savedRun === null) return "new";
    return chosenStart(location.state) ?? "ask";
  });

  const hasChosenState = chosenStart(location.state) !== null;
  useEffect(() => {
    if (hasChosenState) void navigate(location.pathname, { replace: true, state: null });
  }, [hasChosenState, location.pathname, navigate]);

  const resume = useCallback(() => setStart("resume"), []);
  const startNew = useCallback(() => setStart("new"), []);

  return { start, savedRun: start === "new" ? null : savedRun, resume, startNew };
}
