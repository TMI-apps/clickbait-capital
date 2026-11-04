import { useCallback, useMemo, useState } from "react";
import type { GameContent, GameState, MeterKey } from "@/features/game-engine/api";
import { createGame, getPendingEvent, playCard, resolveEvent } from "@/features/game-engine/api";
import {
  feedEntryForCard,
  feedEntryForEvent,
  toDraft,
  toEventView,
  toGameEnd,
  toMeters,
  toPhaseProgress,
} from "@/features/game-board/services/boardView";
import type { BoardView, FeedEntry } from "@/features/game-board/types/gameBoard.types";

export interface UseGameSessionOptions {
  content: GameContent;
  /** Fixed seed (tests, replays). Without it every run gets a random seed. */
  seed?: number;
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
}

interface SessionState {
  game: GameState;
  feed: FeedEntry[];
  previousMeters: Record<MeterKey, number> | null;
}

const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31);

const startSession = (content: GameContent, seed: number | undefined): SessionState => ({
  game: createGame({ content, seed: seed ?? randomSeed() }),
  feed: [],
  previousMeters: null,
});

/**
 * One run of the game over the rules engine: holds the engine state, the feed history and
 * the meters before the last action, and exposes the board view. All rules stay in the
 * engine; this hook only sequences calls and keeps UI history.
 */
export function useGameSession({ content, seed }: UseGameSessionOptions): GameSession {
  const [session, setSession] = useState<SessionState>(() => startSession(content, seed));

  const play = useCallback(
    (cardId: string) => {
      setSession((current) => {
        const { game } = current;
        const card = content.cards.find((candidate) => candidate.id === cardId);
        const inHand = game.hand !== null && Object.values(game.hand).includes(cardId);
        if (game.status !== "playing" || !card || !inHand) {
          return current;
        }
        return {
          game: playCard(game, content, cardId),
          feed: [feedEntryForCard(card, game.turn), ...current.feed],
          previousMeters: game.meters,
        };
      });
    },
    [content]
  );

  const chooseOption = useCallback(
    (optionId: string) => {
      setSession((current) => {
        const { game } = current;
        const event = game.status === "event" ? getPendingEvent(game, content) : null;
        if (!event || !event.options.some((option) => option.id === optionId)) {
          return current;
        }
        return {
          game: resolveEvent(game, content, optionId),
          feed: [feedEntryForEvent(event, optionId, game.turn), ...current.feed],
          previousMeters: game.meters,
        };
      });
    },
    [content]
  );

  const restart = useCallback(() => setSession(startSession(content, seed)), [content, seed]);

  const view = useMemo<BoardView>(() => {
    const { game, feed, previousMeters } = session;
    return {
      meters: toMeters(game, previousMeters),
      phase: toPhaseProgress(game, content),
      draft: toDraft(game, content),
      feed,
      event: toEventView(game, content),
      end: toGameEnd(game),
    };
  }, [session, content]);

  return { view, status: session.game.status, play, chooseOption, restart };
}
