import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameContent, GameState } from "@/features/game-engine/api";
import type { RunAction, SavedRun } from "@/features/game-save/api";
import { clearSavedRun, writeSavedRun } from "@/features/game-save/api";
import {
  toDraft,
  toEventView,
  toGameEnd,
  toMeters,
  toPhaseProgress,
} from "@/features/game-board/services/boardView";
import type { BoardSounds } from "@/features/game-board/services/boardSounds";
import {
  applyAction,
  restoreSession,
  startSession,
  toSavedRun,
} from "@/features/game-board/services/gameSession";
import type { SessionState } from "@/features/game-board/services/gameSession";
import type { BoardView } from "@/features/game-board/types/gameBoard.types";

export interface UseGameSessionOptions {
  content: GameContent;
  /** Fixed seed (tests, replays). Without it every run gets a random seed. */
  seed?: number;
  /** A saved run to continue (local-save D1); ignored when it no longer replays. */
  savedRun?: SavedRun | null;
}

export interface GameSession {
  view: BoardView;
  status: GameState["status"];
  /** Plays a card of the open draft. Ignored when no draft is open. */
  play: (cardId: string) => void;
  /** Answers the pending event. Ignored when no event is pending. */
  chooseOption: (optionId: string) => void;
  /** Starts a fresh run with a new seed (or the fixed one). */
  restart: () => void;
  /** Sounds earned by the last action; `key` changes once per action (`useBoardSounds`). */
  sounds: BoardSounds;
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

const freshRun = (content: GameContent, seed: number | undefined): RunState => ({
  session: startSession(content, seed ?? randomSeed()),
  resumed: false,
  seenPhase: 0,
});

/** The phase before the saved run's last action (replayed without it). */
const phaseBeforeLastAction = (content: GameContent, saved: SavedRun): number =>
  restoreSession(content, { ...saved, actions: saved.actions.slice(0, -1) })?.game.phase ?? 0;

const openRun = (
  content: GameContent,
  seed: number | undefined,
  savedRun: SavedRun | null | undefined
): RunState => {
  const restored = savedRun ? restoreSession(content, savedRun) : null;
  if (!restored || !savedRun) return freshRun(content, seed);
  return { session: restored, resumed: true, seenPhase: phaseBeforeLastAction(content, savedRun) };
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
 * One run of the game over the rules engine: holds the engine state, the feed history and
 * the meters before the last action, and exposes the board view. All rules stay in the
 * engine and the action handling in `gameSession`; this hook sequences calls, keeps UI
 * history and saves the run on the device.
 */
export function useGameSession({ content, seed, savedRun }: UseGameSessionOptions): GameSession {
  const [run, setRun] = useState<RunState>(() => openRun(content, seed, savedRun));
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

  const restart = useCallback(() => setRun(freshRun(content, seed)), [content, seed]);

  const view = useMemo<BoardView>(() => {
    const { game, feed, previousMeters } = session;
    return {
      meters: toMeters(game, previousMeters),
      phase: toPhaseProgress(game, content),
      draft: toDraft(game, content),
      feed,
      event: toEventView(game, content),
      end: toGameEnd(game, content),
    };
  }, [session, content]);

  return {
    view,
    status: session.game.status,
    play,
    chooseOption,
    restart,
    sounds: session.sounds,
    resumed: run.resumed,
    seenPhase: run.seenPhase,
  };
}
