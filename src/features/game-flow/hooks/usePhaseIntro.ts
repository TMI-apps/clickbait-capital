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
 */
export function usePhaseIntro(phaseId: number): PhaseIntroState {
  const [seenPhase, setSeenPhase] = useState(0);
  const dismiss = useCallback(() => setSeenPhase(phaseId), [phaseId]);
  const reset = useCallback(() => setSeenPhase(0), []);
  return { pendingPhase: phaseId > seenPhase ? phaseId : null, dismiss, reset };
}
