import type { GameContent, GameState, MeterKey } from "@/features/game-engine/api";
import { createGame, getPendingEvent, playCard, resolveEvent } from "@/features/game-engine/api";
import type { RunAction, SavedRun } from "@/features/game-save/api";
import { SAVED_RUN_VERSION } from "@/features/game-save/api";
import { feedEntryForCard, feedEntryForEvent } from "@/features/game-board/services/boardView";
import { soundsForAction } from "@/features/game-board/services/boardSounds";
import type { BoardSounds } from "@/features/game-board/services/boardSounds";
import type { FeedEntry } from "@/features/game-board/types/gameBoard.types";

/** One run as the board holds it: engine state plus the UI history the engine doesn't keep. */
export interface SessionState {
  game: GameState;
  feed: FeedEntry[];
  previousMeters: Record<MeterKey, number> | null;
  sounds: BoardSounds;
  /** Every accepted action, oldest first: with the seed this is the save (local-save D1). */
  actions: RunAction[];
}

/** A fresh run on `seed`. */
export const startSession = (content: GameContent, seed: number): SessionState => ({
  game: createGame({ content, seed }),
  feed: [],
  previousMeters: null,
  sounds: { ids: [], key: 0 },
  actions: [],
});

const playAction = (
  current: SessionState,
  content: GameContent,
  action: Extract<RunAction, { kind: "card" }>
): SessionState => {
  const { game } = current;
  const card = content.cards.find((candidate) => candidate.id === action.cardId);
  const inHand = game.hand !== null && Object.values(game.hand).includes(action.cardId);
  if (game.status !== "playing" || !card || !inHand) return current;
  const next = playCard(game, content, action.cardId);
  return {
    game: next,
    feed: [feedEntryForCard(card, game.turn), ...current.feed],
    previousMeters: game.meters,
    sounds: {
      ids: soundsForAction({ cardType: card.type, before: game, after: next }),
      key: current.sounds.key + 1,
    },
    actions: [...current.actions, action],
  };
};

const answerAction = (
  current: SessionState,
  content: GameContent,
  action: Extract<RunAction, { kind: "option" }>
): SessionState => {
  const { game } = current;
  const event = game.status === "event" ? getPendingEvent(game, content) : null;
  if (!event || !event.options.some((option) => option.id === action.optionId)) return current;
  const next = resolveEvent(game, content, action.optionId);
  return {
    game: next,
    feed: [feedEntryForEvent(event, action.optionId, game.turn), ...current.feed],
    previousMeters: game.meters,
    sounds: {
      ids: soundsForAction({ cardType: null, before: game, after: next }),
      key: current.sounds.key + 1,
    },
    actions: [...current.actions, action],
  };
};

/**
 * Applies one player action. An action the run can't take now (no open draft, card not in
 * hand, no such event option) returns `current` unchanged, so callers can detect a rejection.
 */
export const applyAction = (
  current: SessionState,
  content: GameContent,
  action: RunAction
): SessionState =>
  action.kind === "card"
    ? playAction(current, content, action)
    : answerAction(current, content, action);

const isOver = (session: SessionState): boolean =>
  session.game.status === "won" || session.game.status === "lost";

/**
 * Rebuilds a saved run by replaying its actions on its seed. Null when any action is rejected
 * or the run is already over, e.g. after an update changed the cards (local-save D2). Sounds
 * restart at "nothing to play", so a resume is silent.
 */
export const restoreSession = (content: GameContent, saved: SavedRun): SessionState | null => {
  let session = startSession(content, saved.seed);
  for (const action of saved.actions) {
    const next = applyAction(session, content, action);
    if (next === session || isOver(next)) return null;
    session = next;
  }
  return { ...session, sounds: { ids: [], key: 0 } };
};

/** What to store for this session: a run in progress with at least one action, else nothing (D3). */
export const toSavedRun = (session: SessionState): SavedRun | null =>
  isOver(session) || session.actions.length === 0
    ? null
    : { version: SAVED_RUN_VERSION, seed: session.game.seed, actions: session.actions };
