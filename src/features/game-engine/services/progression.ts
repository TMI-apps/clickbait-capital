import type {
  EventDefinition,
  EventPacingConfig,
  FullEffects,
  GameContent,
  GoalCondition,
  MeterKey,
  PhaseDefinition,
  PhaseGoal,
  PhaseId,
  StatKey,
} from "@/features/game-engine/types/gameContent.types";
import type { GameOverReason } from "@/features/game-engine/types/gameState.types";
import { nextRandom } from "@/features/game-engine/services/seededRandom";

/**
 * Progression rules: absolute stats next to the meters, phase goals, game overs, event
 * triggers and their pacing. Pure; reads content, never mutates.
 */

/** Game-over order when several meters hit 0 in the same turn (game-engine D7). */
const GAME_OVER_ORDER: ReadonlyArray<[MeterKey, GameOverReason]> = [
  ["revenue", "bankrupt"],
  ["users", "abandoned"],
  ["reputation", "banned"],
];

/** Looks up a phase; throws when the content lacks it, since the engine cannot continue. */
export function getPhase(content: GameContent, id: PhaseId): PhaseDefinition {
  const phase = content.phases.find((candidate) => candidate.id === id);
  if (!phase) {
    throw new Error(`game-engine: content has no phase ${id}`);
  }
  return phase;
}

/**
 * The users stat read off the Gebruikers meter (game-engine D1): the meter's share of the
 * phase's market. Monotone in the meter and above 0 whenever the meter is.
 */
export function usersForMeter(meter: number, phase: PhaseDefinition): number {
  return Math.round((meter * phase.usersAtFullMeter) / 100);
}

/**
 * Lowest whole Gebruikers level whose users stat reaches `target` in this phase, so a board
 * can name the meter level a users goal needs. Can exceed 100 when the market is too small.
 */
export function meterForUsers(target: number, phase: PhaseDefinition): number {
  if (!(phase.usersAtFullMeter > 0)) {
    throw new Error(`game-engine: phase ${phase.id} needs a positive usersAtFullMeter`);
  }
  let meter = Math.max(0, Math.ceil((target * 100) / phase.usersAtFullMeter));
  while (meter > 0 && usersForMeter(meter - 1, phase) >= target) {
    meter -= 1;
  }
  while (usersForMeter(meter, phase) < target) {
    meter += 1;
  }
  return meter;
}

/**
 * Gross omzet after a card or event (game-engine D1): only positive revenue deltas count, so it
 * never falls; passive costs are not effects and do not count.
 */
export function addGrossRevenue(
  revenue: number,
  effects: FullEffects,
  phase: PhaseDefinition
): number {
  return revenue + Math.max(0, effects.revenue) * phase.revenuePerPoint;
}

/** Returns the game-over reason for the first meter at 0, or null. */
export function getGameOver(meters: Record<MeterKey, number>): GameOverReason | null {
  const hit = GAME_OVER_ORDER.find(([meter]) => meters[meter] <= 0);
  return hit ? hit[1] : null;
}

interface GoalSnapshot {
  meters: Record<MeterKey, number>;
  stats: Record<StatKey, number>;
}

function conditionHolds(condition: GoalCondition, snapshot: GoalSnapshot): boolean {
  if (condition.kind === "stat") {
    return snapshot.stats[condition.stat] >= condition.atLeast;
  }
  return snapshot.meters[condition.meter] > condition.above;
}

/** True when every goal condition holds this turn (the streak is counted by the engine). */
export function goalHolds(goal: PhaseGoal, snapshot: GoalSnapshot): boolean {
  return goal.conditions.every((condition) => conditionHolds(condition, snapshot));
}

/**
 * Event pacing (game-engine D10): world events arrive as surprises spread over the run, not in
 * bursts. At most one event opens per card turn; a regular event waits for the seeded gap after
 * the previous one, an urgent one (a milestone, or any event while Toxicity is at crisis level)
 * only for the short urgent gap. Pure; the random gap comes from the run's RNG state.
 */

/** What pacing reads from the game state. */
export interface PacingSnapshot {
  turn: number;
  phase: PhaseId;
  toxicity: number;
  firedEventIds: readonly string[];
  /** Card turn on which the last event opened, or null before the first. */
  lastEventTurn: number | null;
  /** Earliest card turn on which a regular (non-urgent) event may open. */
  nextEventTurn: number;
}

/** Due by its trigger alone. A milestone stays due after its phase until it fires (carried). */
function isTriggered(event: EventDefinition, snapshot: PacingSnapshot): boolean {
  const { trigger } = event;
  if (trigger.kind === "milestone") {
    return snapshot.phase >= trigger.phase;
  }
  const inPhase = trigger.phases === undefined || trigger.phases.includes(snapshot.phase);
  return inPhase && snapshot.toxicity > trigger.threshold;
}

/** Milestones, and every event while Toxicity is at crisis level, may skip the random gap. */
function isUrgent(event: EventDefinition, snapshot: PacingSnapshot, pacing: EventPacingConfig) {
  return event.trigger.kind === "milestone" || snapshot.toxicity >= pacing.crisisToxicity;
}

/** Card turns since the last event; Infinity before the first. */
function turnsSinceLastEvent(snapshot: PacingSnapshot): number {
  return snapshot.lastEventTurn === null
    ? Number.POSITIVE_INFINITY
    : snapshot.turn - snapshot.lastEventTurn;
}

/**
 * The event that opens now, or null: the open, triggered events that pacing allows on this
 * turn, milestones first, then content order (game-engine D6). Never a second event on the
 * turn of the previous one.
 */
export function findTriggeredEvent(
  content: GameContent,
  snapshot: PacingSnapshot
): EventDefinition | null {
  const pacing = content.balance.eventPacing;
  const since = turnsSinceLastEvent(snapshot);
  if (since < Math.max(1, pacing.urgentMinTurnsBetween)) {
    return null;
  }
  const regularAllowed = snapshot.turn >= snapshot.nextEventTurn;
  const open = content.events.filter(
    (event) =>
      !snapshot.firedEventIds.includes(event.id) &&
      isTriggered(event, snapshot) &&
      (regularAllowed || isUrgent(event, snapshot, pacing))
  );
  return open.find((event) => event.trigger.kind === "milestone") ?? open[0] ?? null;
}

/**
 * Pacing state after an event opens on `turn`: the next regular event waits
 * `minTurnsBetween` plus a seeded 0…`randomExtraTurns` turns, so its timing is not predictable.
 */
export function scheduleNextEvent(
  pacing: EventPacingConfig,
  turn: number,
  rngState: number
): { lastEventTurn: number; nextEventTurn: number; rngState: number } {
  const step = nextRandom(rngState);
  const extra = Math.floor(step.value * (pacing.randomExtraTurns + 1));
  return {
    lastEventTurn: turn,
    nextEventTurn: turn + pacing.minTurnsBetween + extra,
    rngState: step.state,
  };
}
