/** One player action of a run, in the order it happened. Replaying them rebuilds the run. */
export type RunAction = { kind: "card"; cardId: string } | { kind: "option"; optionId: string };

/**
 * Schema version of the stored run; bump it (and the key) when the shape changes or when an
 * engine change makes old action logs replay into a different game. 2: event pacing
 * (game-engine D10) moves events to other turns, so a v1 log no longer matches its run. 3: the
 * shuffled hand (shuffled-hand D1) draws other cards, so a v2 log no longer matches. 4: the
 * score model (score-redesign D11, D19) gives other numbers and scandal draws. 5: equal card-type
 * odds (balance-cleanup D2). 6: the draw deck (deck-draw D1–D4) draws other hands. 7: compounding growth from 0 users
 * (exponential-growth D1–D3) gives other numbers and scandal timing. 8: the decision cards and
 * scandals (policy-cards § 3, § 6) change the draw piles and the scandal pool.
 */
export const SAVED_RUN_VERSION = 8;

/**
 * The minimal state that reproduces a run (local-save D1): the engine is pure and seeded, so
 * the seed plus the actions give back the same game, feed and meter changes.
 */
export interface SavedRun {
  version: typeof SAVED_RUN_VERSION;
  seed: number;
  actions: RunAction[];
}

/** How `/spel` starts: ask the player, resume the save, or start a new run. */
export type RunStart = "ask" | "resume" | "new";
