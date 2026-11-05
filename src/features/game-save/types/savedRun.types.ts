/** One player action of a run, in the order it happened. Replaying them rebuilds the run. */
export type RunAction = { kind: "card"; cardId: string } | { kind: "option"; optionId: string };

/** Schema version of the stored run; bump it (and the key) when the shape changes. */
export const SAVED_RUN_VERSION = 1;

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
