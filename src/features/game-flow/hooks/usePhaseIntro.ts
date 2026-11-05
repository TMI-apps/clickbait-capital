import { useCallback, useState } from "react";

export interface PhaseIntroState {
  /** Phase whose intro should show now, or null when the player has seen it. */
  pendingPhase: number | null;
  /** The player continues from the intro. */
  dismiss: () => void;
  /** A new run starts: the phase 1 intro shows again. */
  reset: () => void;
}

/**
 * Remembers which phase intro the player has seen in this run, so a transition screen shows
 * once when a phase starts (including phase 1 at the start of a run, game-flow D2).
 * `initialSeenPhase`: a resumed run opens on the board, not on its phase intro (local-save D5).
 */
export function usePhaseIntro(phaseId: number, initialSeenPhase = 0): PhaseIntroState {
  const [seenPhase, setSeenPhase] = useState(initialSeenPhase);
  const dismiss = useCallback(() => setSeenPhase(phaseId), [phaseId]);
  const reset = useCallback(() => setSeenPhase(0), []);
  return { pendingPhase: phaseId > seenPhase ? phaseId : null, dismiss, reset };
}
