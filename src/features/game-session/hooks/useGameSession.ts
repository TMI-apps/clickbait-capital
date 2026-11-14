import { useCallback, useEffect, useState } from "react";
import type { GameContent, GameState } from "@/features/game-engine/api";
import type { RunAction, SavedRun } from "@/features/game-save/api";
import { clearSavedRun, writeSavedRun } from "@/features/game-save/api";
import {
  applyAction,
  restoreSession,
  startSession,
  toSavedRun,
} from "@/features/game-session/services/gameSession";
import type { SessionState } from "@/features/game-session/services/gameSession";

export interface UseGameSessionOptions {
  content: GameContent;
  /** Fixed seed (tests, replays). Without it every run gets a random seed. */
  seed?: number;
  /** A saved run to continue (local-save D1); ignored when it no longer replays. */
  savedRun?: SavedRun | null;
  /** The name the player gave their app for a new run (app-name AN1); a resumed run keeps its own. */
  appName?: string;
}

export interface GameSession {
  /** The run: engine state, the state before the last action, and the accepted steps. */
  session: SessionState;
  status: GameState["status"];
  /** Plays a card of the open draft. Ignored when no draft is open. */
  play: (cardId: string) => void;
  /** Answers the pending event. Ignored when no event is pending. */
  chooseOption: (optionId: string) => void;
  /** Starts a fresh run with a new seed (or the fixed one). */
  restart: () => void;
  /** This session continues a saved run (until `restart`). */
  resumed: boolean;
  /**
   * Phase whose intro the player already saw: 0 for a new run; for a resumed run the phase
   * before its last action, so an intro the reload interrupted shows again (local-save D5).
   */
  seenPhase: number;
}

const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31);

interface RunState {
  session: SessionState;
  resumed: boolean;
  seenPhase: number;
}

interface FreshRunOptions {
  seed: number | undefined;
  appName: string | undefined;
}

const freshRun = (content: GameContent, { seed, appName }: FreshRunOptions): RunState => ({
  session: startSession(content, seed ?? randomSeed(), appName),
  resumed: false,
  seenPhase: 0,
});

const openRun = (
  content: GameContent,
  fresh: FreshRunOptions,
  savedRun: SavedRun | null | undefined
): RunState => {
  const restored = savedRun ? restoreSession(content, savedRun) : null;
  if (!restored) return freshRun(content, fresh);
  // The replay keeps the state before the last action: its phase is the intro already seen.
  return { session: restored, resumed: true, seenPhase: restored.previousGame?.phase ?? 0 };
};

/** Keeps the device save in step with the run: written per action, cleared at the end (D3). */
function useRunPersistence(session: SessionState): void {
  useEffect(() => {
    const saved = toSavedRun(session);
    if (saved) writeSavedRun(saved);
    else clearSavedRun();
  }, [session]);
}

/**
 * One run of the game over the rules engine: holds the session (engine state, the state
 * before the last action, the accepted steps), takes player actions and keeps the device
 * save in step. All rules stay in the engine and the action handling in `gameSession`;
 * views (the board) derive what they show from `session`.
 */
export function useGameSession({
  content,
  seed,
  savedRun,
  appName,
}: UseGameSessionOptions): GameSession {
  const [run, setRun] = useState<RunState>(() => openRun(content, { seed, appName }, savedRun));
  const { session } = run;
  useRunPersistence(session);

  const dispatch = useCallback(
    (action: RunAction) =>
      setRun((current) => {
        const next = applyAction(current.session, content, action);
        return next === current.session ? current : { ...current, session: next };
      }),
    [content]
  );
  const play = useCallback((cardId: string) => dispatch({ kind: "card", cardId }), [dispatch]);
  const chooseOption = useCallback(
    (optionId: string) => dispatch({ kind: "option", optionId }),
    [dispatch]
  );

  // "Opnieuw" keeps the run's app name, also for a resumed run (app-name lap).
  const restart = useCallback(
    () => setRun((current) => freshRun(content, { seed, appName: current.session.appName })),
    [content, seed]
  );

  return {
    session,
    status: session.game.status,
    play,
    chooseOption,
    restart,
    resumed: run.resumed,
    seenPhase: run.seenPhase,
  };
}
