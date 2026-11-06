import type {
  CardDefinition,
  CardType,
  EventDefinition,
  GameContent,
  PhaseId,
} from "@/features/game-engine/types/gameContent.types";
import type { GameState, Hand } from "@/features/game-engine/types/gameState.types";
import {
  findTriggeredEvent,
  getGameOver,
  getPhase,
  goalHolds,
  addGrossRevenue,
  scheduleNextEvent,
  usersForMeter,
} from "@/features/game-engine/services/progression";
import { pickRandom } from "@/features/game-engine/services/seededRandom";
import {
  applyEffects,
  computeCardTurn,
  isDroughtActive,
  scaleForPhase,
} from "@/features/game-engine/services/turnEffects";

/**
 * Game engine: the state transitions a board calls. Every function is pure and returns a new
 * GameState; randomness comes only from the seeded RNG state inside the game state.
 */

const CARD_TYPES: readonly CardType[] = ["viral", "ad", "news"];
const LAST_PHASE: PhaseId = 4;

/** Input for a new game. */
export interface CreateGameOptions {
  content: GameContent;
  /** Integer seed; the same seed and choices replay the same game. */
  seed: number;
}

function cardsFor(content: GameContent, type: CardType, phase: PhaseId): CardDefinition[] {
  return content.cards.filter(
    (card) => card.type === type && (card.phases?.includes(phase) ?? true)
  );
}

/** Draws one card per type for the phase (design § 4 Type 1). */
export function drawHand(
  content: GameContent,
  phase: PhaseId,
  rngState: number
): { hand: Hand; rngState: number } {
  let state = rngState;
  const ids: Partial<Hand> = {};
  for (const type of CARD_TYPES) {
    const pick = pickRandom(cardsFor(content, type, phase), state);
    ids[type] = pick.item.id;
    state = pick.state;
  }
  return { hand: ids as Hand, rngState: state };
}

/**
 * The single writer of the users stat and its peak (game-engine D1): read off the Gebruikers
 * meter in the current phase. Runs before the goal check and on every exit through `advance`.
 */
function withUsersStat(state: GameState, content: GameContent): GameState {
  const users = usersForMeter(state.meters.users, getPhase(content, state.phase));
  return {
    ...state,
    stats: { ...state.stats, users },
    peakUsers: Math.max(state.peakUsers, users),
  };
}

/** Next step after a card or event: game over, pending event, or a fresh draft. */
function advance(current: GameState, content: GameContent): GameState {
  const state = withUsersStat(current, content);
  const gameOver = getGameOver(state.meters);
  if (gameOver) {
    return { ...state, status: "lost", gameOver, hand: null, pendingEventId: null };
  }
  if (state.status === "won") {
    return { ...state, hand: null, pendingEventId: null };
  }
  const event = findTriggeredEvent(content, state);
  if (event) {
    return {
      ...state,
      ...scheduleNextEvent(content.balance.eventPacing, state.turn, state.rngState),
      status: "event",
      hand: null,
      pendingEventId: event.id,
      firedEventIds: [...state.firedEventIds, event.id],
    };
  }
  const draw = drawHand(content, state.phase, state.rngState);
  return {
    ...state,
    status: "playing",
    hand: draw.hand,
    rngState: draw.rngState,
    pendingEventId: null,
  };
}

/** Counts the goal streak and moves to the next phase, or wins in phase 4. */
function progressPhase(current: GameState, content: GameContent): GameState {
  const state = withUsersStat(current, content);
  const phase = getPhase(content, state.phase);
  const goalStreak = goalHolds(phase.goal, state) ? state.goalStreak + 1 : 0;
  if (goalStreak < phase.goal.consecutiveTurns) {
    return { ...state, goalStreak };
  }
  if (state.phase === LAST_PHASE) {
    return { ...state, goalStreak, status: "won" };
  }
  return { ...state, goalStreak: 0, phase: (state.phase + 1) as PhaseId };
}

/** Starts a game in phase 1 with all meters at the start value and a first draft. */
export function createGame({ content, seed }: CreateGameOptions): GameState {
  const start = content.balance.startMeter;
  const initial: GameState = {
    seed,
    rngState: seed | 0,
    turn: 0,
    phase: 1,
    meters: { revenue: start, users: start, reputation: start },
    toxicity: 0,
    stats: { users: 0, revenue: content.balance.startRevenue },
    peakUsers: 0,
    hand: null,
    pendingEventId: null,
    firedEventIds: [],
    lastEventTurn: null,
    nextEventTurn: content.balance.eventPacing.minTurnsBetween,
    playedTypes: [],
    turnsWithoutNews: 0,
    viralStreak: 0,
    goalStreak: 0,
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
  if (state.status !== "playing" || !state.hand || !Object.values(state.hand).includes(cardId)) {
    throw new Error(`game-engine: card ${cardId} cannot be played now`);
  }
  const card = findCard(content, cardId);
  const phase = getPhase(content, state.phase);
  const turn = computeCardTurn({ ...state, card, phase, balance: content.balance });
  const played: GameState = {
    ...state,
    ...applyEffects(state, turn.totalEffects),
    stats: {
      ...state.stats,
      revenue: addGrossRevenue(state.stats.revenue, turn.cardEffects, phase),
    },
    turn: state.turn + 1,
    playedTypes: [...state.playedTypes, card.type],
    viralStreak: turn.viralStreak,
    turnsWithoutNews: turn.turnsWithoutNews,
    lastTurn: {
      source: { kind: "card", cardId },
      effects: turn.totalEffects,
      modifiers: turn.modifiers,
    },
  };
  if (getGameOver(played.meters)) {
    return advance(played, content);
  }
  return advance(progressPhase(played, content), content);
}

/** The event waiting for a policy choice, or null. */
export function getPendingEvent(state: GameState, content: GameContent): EventDefinition | null {
  return content.events.find((event) => event.id === state.pendingEventId) ?? null;
}

/** Applies one of the pending event's three options. Not a turn: no passive costs or goal count. */
export function resolveEvent(state: GameState, content: GameContent, optionId: string): GameState {
  const event = state.status === "event" ? getPendingEvent(state, content) : null;
  const option = event?.options.find((candidate) => candidate.id === optionId);
  if (!event || !option) {
    throw new Error(`game-engine: option ${optionId} cannot be chosen now`);
  }
  const phase = getPhase(content, state.phase);
  const effects = scaleForPhase(option.effects, phase);
  const resolved: GameState = {
    ...state,
    ...applyEffects(state, effects),
    stats: { ...state.stats, revenue: addGrossRevenue(state.stats.revenue, effects, phase) },
    pendingEventId: null,
    lastTurn: {
      source: { kind: "event", eventId: event.id, optionId },
      effects,
      modifiers: {
        adFatigue: false,
        echoChamber: false,
        journalismDrought: false,
        reputationDecay: false,
      },
    },
  };
  return advance(resolved, content);
}

/** The draft as full card definitions, or null when no draft is open. */
export function getHandCards(
  state: GameState,
  content: GameContent
): Record<CardType, CardDefinition> | null {
  const { hand } = state;
  if (!hand) {
    return null;
  }
  return {
    viral: findCard(content, hand.viral),
    ad: findCard(content, hand.ad),
    news: findCard(content, hand.news),
  };
}

/** Journalistieke Droogte is active: the board marks viral cards with a red border. */
export function isJournalismDroughtActive(state: GameState, content: GameContent): boolean {
  return isDroughtActive(state.turnsWithoutNews, content.balance);
}
