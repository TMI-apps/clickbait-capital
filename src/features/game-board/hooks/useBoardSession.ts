import { useMemo } from "react";
import { commentsForSession } from "@/features/follower-comments/api";
import type { CommentBatch } from "@/features/follower-comments/api";
import type { GameContent } from "@/features/game-engine/api";
import { useGameSession } from "@/features/game-session/api";
import type { GameSession, UseGameSessionOptions } from "@/features/game-session/api";
import {
  toDraft,
  toEventView,
  toFeed,
  toGameEnd,
  toMeters,
  toPhaseProgress,
} from "@/features/game-board/services/boardView";
import { soundsForLastStep } from "@/features/game-board/services/boardSounds";
import type { BoardSounds } from "@/features/game-board/services/boardSounds";
import type { BoardView } from "@/features/game-board/types/gameBoard.types";

export interface BoardSession extends Omit<GameSession, "session"> {
  view: BoardView;
  /** Sounds earned by the last action; `key` changes once per action (`useBoardSounds`). */
  sounds: BoardSounds;
  /** The followers' comments under each post, indexed by session step (`FeedEntry.step`, feed-comments D1). */
  comments: Array<CommentBatch | null>;
}

const toBoardView = (session: GameSession["session"], content: GameContent): BoardView => {
  const { game, previousGame, steps } = session;
  return {
    meters: toMeters(game, previousGame?.meters ?? null),
    phase: toPhaseProgress(game, content),
    draft: toDraft(game, content),
    feed: toFeed(steps, content),
    event: toEventView(game, content),
    end: toGameEnd(game, content),
  };
};

/**
 * The run as the board shows it: the game-session run (`useGameSession`) plus the board
 * view and the last action's sounds, both derived from the session (game-session-split D1).
 */
export function useBoardSession(options: UseGameSessionOptions): BoardSession {
  const { session, ...run } = useGameSession(options);
  const { content } = options;
  const view = useMemo(() => toBoardView(session, content), [session, content]);
  const sounds = useMemo(() => soundsForLastStep(session, content), [session, content]);
  const comments = useMemo(() => commentsForSession(session, content), [session, content]);
  return { ...run, view, sounds, comments };
}
