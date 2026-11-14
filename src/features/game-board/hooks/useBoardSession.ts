import { useMemo } from "react";
import { commentsForSession } from "@/features/follower-comments/api";
import type { CommentBatch } from "@/features/follower-comments/api";
import { DEFAULT_APP_NAME } from "@/features/game-content/api";
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
  toScandalRisk,
  toScoreMarkers,
} from "@/features/game-board/services/boardView";
import { juiceForLastStep } from "@/features/game-board/services/boardJuice";
import type { BoardJuice } from "@/features/game-board/services/boardJuice";
import type { BoardView } from "@/features/game-board/types/gameBoard.types";

export interface BoardSession extends Omit<GameSession, "session"> {
  view: BoardView;
  /** Juice earned by the last action; `key` changes once per action (`useBoardJuice`). */
  juice: BoardJuice;
  /** The followers' comments under each post, indexed by session step (`FeedEntry.step`, feed-comments D1). */
  comments: Array<CommentBatch | null>;
}

const toBoardView = (session: GameSession["session"], content: GameContent): BoardView => {
  const { game, steps } = session;
  const app = session.appName ?? DEFAULT_APP_NAME;
  return {
    appName: app,
    meters: toMeters(game, content, steps),
    scoreMarkers: toScoreMarkers(game, steps, content),
    scandal: toScandalRisk(game, content),
    phase: toPhaseProgress(game, content),
    draft: toDraft(game, content, app),
    feed: toFeed(steps, content, app),
    event: toEventView(game, content, app),
    end: toGameEnd(game, content, app),
  };
};

/**
 * The run as the board shows it: the game-session run (`useGameSession`) plus the board
 * view and the last action's juice, both derived from the session (game-session-split D1).
 */
export function useBoardSession(options: UseGameSessionOptions): BoardSession {
  const { session, ...run } = useGameSession(options);
  const { content } = options;
  const view = useMemo(() => toBoardView(session, content), [session, content]);
  const juice = useMemo(
    () => juiceForLastStep(session, { content, meters: view.meters }),
    [session, content, view.meters]
  );
  const comments = useMemo(() => commentsForSession(session, content), [session, content]);
  return { ...run, view, juice, comments };
}
