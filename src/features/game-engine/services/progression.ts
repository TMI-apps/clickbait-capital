import type {
  EventDefinition,
  EventPacingConfig,
  GameContent,
  PhaseDefinition,
  PhaseGoal,
  PhaseId,
  ScandalConfig,
} from "@/features/game-engine/types/gameContent.types";
import type { GameOverReason } from "@/features/game-engine/types/gameState.types";
import { nextRandom } from "@/features/game-engine/services/seededRandom";

/**
 * Progression rules: phase goals (two goal lines), the one game over, event triggers, the
 * scandal chance and draw, and event pacing. Pure; reads content, never mutates.
 */

/** Looks up a phase; throws when the content lacks it, since the engine cannot continue. */
export function getPhase(content: GameContent, id: PhaseId): PhaseDefinition {
  const phase = content.phases.find((candidate) => candidate.id === id);
  if (!phase) {
    throw new Error(`game-engine: content has no phase ${id}`);
  }
  return phase;
}

/** Bankroet once Geld is below € 0; users and reputation never end the run (score-redesign D16). */
export function getGameOver(money: number): GameOverReason | null {
  return money < 0 ? "bankrupt" : null;
}

/** True when both goal lines are reached this turn (score-redesign D17). */
export function goalReached(goal: PhaseGoal, score: { users: number; money: number }): boolean {
  return score.users >= goal.users && score.money >= goal.money;
}

/**
 * Per-turn scandal chance (score-redesign D13): 0 at or above the threshold, then rising
 * linearly to the maximum over `rampPoints` reputation points. 0–1.
 */
export function scandalChance(reputation: number, config: ScandalConfig): number {
  if (reputation >= config.threshold) {
    return 0;
  }
  const ramp = Math.max(1, config.rampPoints);
  return Math.min(config.maxChance, (config.maxChance * (config.threshold - reputation)) / ramp);
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
  reputation: number;
  rngState: number;
  firedEventIds: readonly string[];
  /** Card turn on which the last event opened, or null before the first. */
  lastEventTurn: number | null;
  /** Earliest card turn on which a regular (non-urgent) event may open. */
  nextEventTurn: number;
}

function inPhases(phases: readonly PhaseId[] | undefined, phase: PhaseId): boolean {
  return phases === undefined || phases.includes(phase);
}

/** Card turns since the last event; Infinity before the first. */
function turnsSinceLastEvent(snapshot: PacingSnapshot): number {
  return snapshot.lastEventTurn === null
    ? Number.POSITIVE_INFINITY
    : snapshot.turn - snapshot.lastEventTurn;
}

/** A milestone that is due (from its phase on) and has not fired yet, in content order. */
function dueMilestone(content: GameContent, snapshot: PacingSnapshot): EventDefinition | null {
  return (
    content.events.find(
      (event) =>
        event.trigger.kind === "milestone" &&
        snapshot.phase >= event.trigger.phase &&
        !snapshot.firedEventIds.includes(event.id)
    ) ?? null
  );
}

/**
 * The scandal to open (score-redesign D22): a random unfired scandal of the phase, or, once all
 * have fired, the one fired longest ago. Null when the phase has none.
 */
function pickScandal(
  content: GameContent,
  snapshot: PacingSnapshot,
  roll: number
): EventDefinition | null {
  const scandals = content.events.filter(
    (event) => event.trigger.kind === "scandal" && inPhases(event.trigger.phases, snapshot.phase)
  );
  const unfired = scandals.filter((event) => !snapshot.firedEventIds.includes(event.id));
  if (unfired.length > 0) {
    return unfired[Math.min(unfired.length - 1, Math.floor(roll * unfired.length))]!;
  }
  const lastFired = (event: EventDefinition): number =>
    snapshot.firedEventIds.lastIndexOf(event.id);
  return [...scandals].sort((a, b) => lastFired(a) - lastFired(b))[0] ?? null;
}

/**
 * A scandal may be rolled for: after the first card (never on a fresh run), with a chance above
 * 0, and once the regular gap has passed, unless the chance is at its maximum (urgent).
 */
function scandalMayOpen(snapshot: PacingSnapshot, chance: number, maxChance: number): boolean {
  if (snapshot.turn === 0 || chance <= 0) {
    return false;
  }
  return chance >= maxChance || snapshot.turn >= snapshot.nextEventTurn;
}

/** The event that opens now (if any) and the RNG state after the scandal rolls. */
export interface TriggeredEvent {
  event: EventDefinition | null;
  rngState: number;
}

/**
 * The event that opens now, or null (game-engine D10, score-redesign D22). Never a second event
 * on the turn of the previous one or within the urgent gap. A due milestone comes first; then,
 * when pacing allows a regular event (or the scandal chance is at its maximum, which is urgent),
 * the seeded RNG rolls against the scandal chance. The roll only uses RNG state when a scandal
 * can open, so runs without scandal risk replay as before.
 */
export function findTriggeredEvent(content: GameContent, snapshot: PacingSnapshot): TriggeredEvent {
  const { eventPacing: pacing, scandal } = content.balance;
  const none = { event: null, rngState: snapshot.rngState };
  if (turnsSinceLastEvent(snapshot) < Math.max(1, pacing.urgentMinTurnsBetween)) {
    return none;
  }
  const milestone = dueMilestone(content, snapshot);
  if (milestone) {
    return { event: milestone, rngState: snapshot.rngState };
  }
  const chance = scandalChance(snapshot.reputation, scandal);
  if (!scandalMayOpen(snapshot, chance, scandal.maxChance)) {
    return none;
  }
  const roll = nextRandom(snapshot.rngState);
  if (roll.value >= chance) {
    return { event: null, rngState: roll.state };
  }
  const pick = nextRandom(roll.state);
  return { event: pickScandal(content, snapshot, pick.value), rngState: pick.state };
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
