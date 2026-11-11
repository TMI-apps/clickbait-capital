/**
 * Seeded pseudo-random numbers (mulberry32). The state is a plain 32-bit integer kept in
 * the game state, so a run replays exactly from its seed and stays serializable.
 */

export interface RandomStep {
  /** Uniform value in [0, 1). */
  value: number;
  state: number;
}

/** Advances the generator one step. */
export function nextRandom(state: number): RandomStep {
  const nextState = (state + 0x6d2b79f5) | 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: nextState };
}

/** Picks one item uniformly; throws on an empty list because the draft must never be short. */
export function pickRandom<T>(items: readonly T[], state: number): { item: T; state: number } {
  if (items.length === 0) {
    throw new Error("pickRandom: empty list");
  }
  const step = nextRandom(state);
  return { item: items[Math.floor(step.value * items.length)] as T, state: step.state };
}
