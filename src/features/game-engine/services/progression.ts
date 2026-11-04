import type {
  EventDefinition,
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

/**
 * Progression rules: absolute stats next to the meters, phase goals, game overs and
 * event triggers. Pure; reads content, never mutates.
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
 * Maps a card's or event's meter change to absolute stats (game-engine D1): users move with
 * the users delta (floor 0); revenue is gross omzet and only grows with positive revenue deltas.
 */
export function updateStats(
  stats: Record<StatKey, number>,
  effects: FullEffects,
  phase: PhaseDefinition
): Record<StatKey, number> {
  return {
    users: Math.max(0, stats.users + effects.users * phase.usersPerPoint),
    revenue: stats.revenue + Math.max(0, effects.revenue) * phase.revenuePerPoint,
  };
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

interface TriggerSnapshot {
  phase: PhaseId;
  toxicity: number;
  firedEventIds: readonly string[];
}

function isTriggered(event: EventDefinition, snapshot: TriggerSnapshot): boolean {
  const { trigger } = event;
  if (trigger.kind === "milestone") {
    return trigger.phase === snapshot.phase;
  }
  const inPhase = trigger.phases === undefined || trigger.phases.includes(snapshot.phase);
  return inPhase && snapshot.toxicity > trigger.threshold;
}

/**
 * First event (content order, milestones before toxicity) that is due and has not fired yet
 * (game-engine D6), or null.
 */
export function findTriggeredEvent(
  content: GameContent,
  snapshot: TriggerSnapshot
): EventDefinition | null {
  const open = content.events.filter(
    (event) => !snapshot.firedEventIds.includes(event.id) && isTriggered(event, snapshot)
  );
  return open.find((event) => event.trigger.kind === "milestone") ?? open[0] ?? null;
}
