import type { GameContent, GameState } from "@/features/game-engine/api";
import { createGame, getPendingEvent, playCard, resolveEvent } from "@/features/game-engine/api";
import type { RunAction, SavedRun } from "@/features/game-save/api";
import { SAVED_RUN_VERSION } from "@/features/game-save/api";

/** One accepted player action with the facts a view needs to show it later. */
export interface SessionStep {
  action: RunAction;
  /** Engine turn when the action was taken. */
  turn: number;
  /** The event the option answered; null for a card play. */
  eventId: string | null;
  /**
   * Engine state right after the action. Lets a view derive per-post facts for every step, not
   * only the last one (feed comments, feed-comments D3); rebuilt by the replay, never saved.
   */
  state: GameState;
}

/**
 * One run: engine state plus the history the engine doesn't keep. Holds facts only; the
 * board derives its feed, meter deltas and sounds from them (game-session-split D1).
 */
export interface SessionState {
  game: GameState;
  /** Engine state before the last action; null before the first one. */
  previousGame: GameState | null;
  /** Every accepted action, oldest first: with the seed this is the save (local-save D1). */
  steps: SessionStep[];
  /** How many of `steps` were rebuilt from a save: their effects already happened (silent). */
  replayedStepCount: number;
  /**
   * The name the player gave their app (app-name AN1): presentation only, the engine never
   * reads it; saved with the run. Absent for runs started without the naming step.
   */
  appName?: string;
}

/** A fresh run on `seed`, for the app the player named (when they did). */
export const startSession = (
  content: GameContent,
  seed: number,
  appName?: string
): SessionState => ({
  game: createGame({ content, seed }),
  previousGame: null,
  steps: [],
  replayedStepCount: 0,
  ...(appName === undefined ? {} : { appName }),
});

const advance = (
  current: SessionState,
  next: GameState,
  step: Omit<SessionStep, "state">
): SessionState => ({
  ...current,
  game: next,
  previousGame: current.game,
  steps: [...current.steps, { ...step, state: next }],
});

const playAction = (
  current: SessionState,
  content: GameContent,
  action: Extract<RunAction, { kind: "card" }>
): SessionState => {
  const { game } = current;
  const inHand = game.hand?.includes(action.cardId) ?? false;
  const known = content.cards.some((candidate) => candidate.id === action.cardId);
  if (game.status !== "playing" || !known || !inHand) return current;
  const next = playCard(game, content, action.cardId);
  return advance(current, next, { action, turn: game.turn, eventId: null });
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
  return advance(current, next, { action, turn: game.turn, eventId: event.id });
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
 * or the run is already over, e.g. after an update changed the cards (local-save D2). All
 * steps count as replayed, so a resume is silent.
 */
export const restoreSession = (content: GameContent, saved: SavedRun): SessionState | null => {
  let session = startSession(content, saved.seed, saved.appName);
  for (const action of saved.actions) {
    const next = applyAction(session, content, action);
    if (next === session || isOver(next)) return null;
    session = next;
  }
  return { ...session, replayedStepCount: session.steps.length };
};

/** What to store for this session: a run in progress with at least one action, else nothing (D3). */
export const toSavedRun = (session: SessionState): SavedRun | null =>
  isOver(session) || session.steps.length === 0
    ? null
    : {
        version: SAVED_RUN_VERSION,
        seed: session.game.seed,
        actions: session.steps.map((step) => step.action),
        ...(session.appName === undefined ? {} : { appName: session.appName }),
      };
