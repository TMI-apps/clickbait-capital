import type {
  BalanceConfig,
  CardDefinition,
  CardType,
  EventDefinition,
  EventOption,
  FullEffects,
  GameContent,
  PhaseDefinition,
  PhaseId,
} from "@/features/game-engine/types/gameContent.types";
import type { GameState, Hand } from "@/features/game-engine/types/gameState.types";
import {
  findTriggeredEvent,
  getGameOver,
  getPhase,
  goalReached,
  scheduleNextEvent,
} from "@/features/game-engine/services/progression";
import { pickRandom } from "@/features/game-engine/services/seededRandom";
import {
  applyScore,
  computeCardTurn,
  scaleForPhase,
  type ScoreChange,
} from "@/features/game-engine/services/turnEffects";

/**
 * Game engine: the state transitions a board calls. Every function is pure and returns a new
 * GameState; randomness comes only from the seeded RNG state inside the game state.
 */

/** Cards in every draft (design § 4 Type 1). */
export const HAND_SIZE = 3;
const LAST_PHASE: PhaseId = 4;

/** Input for a new game. */
export interface CreateGameOptions {
  content: GameContent;
  /** Integer seed; the same seed and choices replay the same game. */
  seed: number;
}

function cardsFor(content: GameContent, phase: PhaseId): CardDefinition[] {
  return content.cards.filter((card) => card.phases?.includes(phase) ?? true);
}

/** The card types a hand slot picks between, in a fixed order so draws replay per seed. */
const CARD_TYPES: readonly CardType[] = ["viral", "ad", "news"];

/**
 * Draws `HAND_SIZE` different cards in draw order (shuffled-hand D1, D2; balance-cleanup D2):
 * each slot first picks a card type with equal chance, then a card of that type from the
 * phase's pool, so every type is about 1/3 of the hand whatever the pool's mix. Types can
 * repeat in one hand and no slot is tied to a type. A type with no undrawn card left in the
 * pool drops out of that slot's pick (fallback: equal chance over the types that still have one).
 */
export function drawHand(
  content: GameContent,
  phase: PhaseId,
  rngState: number
): { hand: Hand; rngState: number } {
  let state = rngState;
  let pool = cardsFor(content, phase);
  if (pool.length < HAND_SIZE) {
    throw new Error(`game-engine: phase ${phase} has fewer than ${HAND_SIZE} cards`);
  }
  const ids: string[] = [];
  while (ids.length < HAND_SIZE) {
    const types = CARD_TYPES.filter((type) => pool.some((card) => card.type === type));
    const typePick = pickRandom(types, state);
    const pick = pickRandom(
      pool.filter((card) => card.type === typePick.item),
      typePick.state
    );
    ids.push(pick.item.id);
    pool = pool.filter((card) => card !== pick.item);
    state = pick.state;
  }
  return { hand: ids, rngState: state };
}

/** Writes a turn's score change into the state and keeps the users peak (end screens). */
function withScore(state: GameState, change: ScoreChange): GameState {
  return {
    ...state,
    users: change.users,
    money: change.money,
    reputation: change.reputation,
    toxicity: change.toxicity,
    peakUsers: Math.max(state.peakUsers, change.users),
  };
}

/** Next step after a card or event: game over, pending event, or a fresh draft. */
function advance(state: GameState, content: GameContent): GameState {
  const gameOver = getGameOver(state.money);
  if (gameOver) {
    return { ...state, status: "lost", gameOver, hand: null, pendingEventId: null };
  }
  if (state.status === "won") {
    return { ...state, hand: null, pendingEventId: null };
  }
  const { event, rngState } = findTriggeredEvent(content, state);
  if (event) {
    return {
      ...state,
      ...scheduleNextEvent(content.balance.eventPacing, state.turn, rngState),
      status: "event",
      hand: null,
      pendingEventId: event.id,
      firedEventIds: [...state.firedEventIds, event.id],
    };
  }
  const draw = drawHand(content, state.phase, rngState);
  return {
    ...state,
    status: "playing",
    hand: draw.hand,
    rngState: draw.rngState,
    pendingEventId: null,
  };
}

/** Both goal lines reached: the next phase, or the win in phase 4 (score-redesign D17). */
function progressPhase(state: GameState, content: GameContent): GameState {
  if (!goalReached(getPhase(content, state.phase).goal, state)) {
    return state;
  }
  if (state.phase === LAST_PHASE) {
    return { ...state, status: "won" };
  }
  return { ...state, phase: (state.phase + 1) as PhaseId };
}

/** Starts a game in phase 1 with the start users, money and reputation, and a first draft. */
export function createGame({ content, seed }: CreateGameOptions): GameState {
  const { balance } = content;
  const initial: GameState = {
    seed,
    rngState: seed | 0,
    turn: 0,
    phase: 1,
    users: balance.startUsers,
    money: balance.startMoney,
    reputation: balance.startReputation,
    toxicity: 0,
    peakUsers: balance.startUsers,
    hand: null,
    pendingEventId: null,
    firedEventIds: [],
    lastEventTurn: null,
    nextEventTurn: content.balance.eventPacing.minTurnsBetween,
    playedTypes: [],
    turnsWithoutNews: 0,
    viralStreak: 0,
    status: "playing",
    gameOver: null,
    lastTurn: null,
  };
  return advance(initial, content);
}

function findCard(content: GameContent, cardId: string): CardDefinition {
  const card = content.cards.find((candidate) => candidate.id === cardId);
  if (!card) {
    throw new Error(`game-engine: unknown card ${cardId}`);
  }
  return card;
}

/** Plays one card from the current draft into the feed: one turn. Throws on an invalid move. */
export function playCard(state: GameState, content: GameContent, cardId: string): GameState {
  if (state.status !== "playing" || !state.hand || !state.hand.includes(cardId)) {
    throw new Error(`game-engine: card ${cardId} cannot be played now`);
  }
  const card = findCard(content, cardId);
  const phase = getPhase(content, state.phase);
  const turn = computeCardTurn({ ...state, card, phase, balance: content.balance });
  const change = applyScore(state, turn.totalEffects, {
    phase,
    userLossPerPoint: content.balance.userLossPerPoint,
    gainEffects: turn.cardEffects,
  });
  const played: GameState = {
    ...withScore(state, change),
    turn: state.turn + 1,
    playedTypes: [...state.playedTypes, card.type],
    viralStreak: turn.viralStreak,
    turnsWithoutNews: turn.turnsWithoutNews,
    lastTurn: {
      source: { kind: "card", cardId },
      effects: turn.totalEffects,
      delta: change.delta,
      modifiers: turn.modifiers,
    },
  };
  if (getGameOver(played.money)) {
    return advance(played, content);
  }
  return advance(progressPhase(played, content), content);
}

/** The event waiting for a policy choice, or null. */
export function getPendingEvent(state: GameState, content: GameContent): EventDefinition | null {
  return content.events.find((event) => event.id === state.pendingEventId) ?? null;
}

/**
 * Applies one of the pending event's three options. Not a turn: no passive costs, and the goal
 * lines are checked only after the next card (an event never ends a phase on its own).
 */
export function resolveEvent(state: GameState, content: GameContent, optionId: string): GameState {
  const event = state.status === "event" ? getPendingEvent(state, content) : null;
  const option = event?.options.find((candidate) => candidate.id === optionId);
  if (!event || !option) {
    throw new Error(`game-engine: option ${optionId} cannot be chosen now`);
  }
  const phase = getPhase(content, state.phase);
  const effects = eventOptionEffects(option, phase);
  const scored = applyScore(state, effects, {
    phase,
    userLossPerPoint: content.balance.userLossPerPoint,
  });
  const fine = scandalFine(event, { phase, balance: content.balance });
  const change = {
    ...scored,
    money: scored.money - fine,
    delta: { ...scored.delta, money: scored.delta.money - fine },
  };
  const resolved: GameState = {
    ...withScore(state, change),
    pendingEventId: null,
    lastTurn: {
      source: { kind: "event", eventId: event.id, optionId },
      effects,
      delta: change.delta,
      modifiers: {
        adFatigue: false,
        echoChamber: false,
        reputationDecay: false,
      },
    },
  };
  return advance(resolved, content);
}

/** What an event option does in this phase, in points (the board shows the same). */
export function eventOptionEffects(option: EventOption, phase: PhaseDefinition): FullEffects {
  return scaleForPhase(option.effects, phase);
}

/**
 * Euros a scandal costs on top of its option (score-redesign D25): `finePoints` at the phase's
 * `moneyPerPoint`. 0 for other events.
 */
export function scandalFine(
  event: EventDefinition,
  context: { phase: PhaseDefinition; balance: BalanceConfig }
): number {
  return event.trigger.kind === "scandal"
    ? context.balance.scandal.finePoints * context.phase.moneyPerPoint
    : 0;
}

/** The draft as full card definitions in slot order, or null when no draft is open. */
export function getHandCards(state: GameState, content: GameContent): CardDefinition[] | null {
  return state.hand?.map((cardId) => findCard(content, cardId)) ?? null;
}
