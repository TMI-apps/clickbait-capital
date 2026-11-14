import { describe, expect, it } from "vitest";
import { SEED_CONTENT } from "@/features/game-engine/api";
import type { SavedRun } from "@/features/game-save/api";
import {
  applyAction,
  restoreSession,
  startSession,
  toSavedRun,
} from "@/features/game-session/services/gameSession";
import type { SessionState } from "@/features/game-session/services/gameSession";

/** Plays `steps` actions like a simple player: first event option, else the first hand card. */
const playSteps = (steps: number, seed = 5): SessionState => {
  let session = startSession(SEED_CONTENT, seed);
  for (let step = 0; step < steps; step++) {
    const { game } = session;
    if (game.status === "event") {
      const event = SEED_CONTENT.events.find((candidate) => candidate.id === game.pendingEventId);
      session = applyAction(session, SEED_CONTENT, {
        kind: "option",
        optionId: event?.options[0].id ?? "",
      });
    } else {
      session = applyAction(session, SEED_CONTENT, {
        kind: "card",
        cardId: Object.values(game.hand ?? {})[0],
      });
    }
  }
  return session;
};

const toRun = (session: SessionState): SavedRun => {
  const saved = toSavedRun(session);
  if (!saved) throw new Error("expected a run in progress");
  return saved;
};

describe("gameSession", () => {
  describe("acceptance", () => {
    it("should rebuild the identical game, steps and previous state when a saved run is replayed", () => {
      const played = playSteps(4);

      const restored = restoreSession(SEED_CONTENT, toRun(played));

      expect(restored?.game).toEqual(played.game);
      expect(restored?.steps).toEqual(played.steps);
      expect(restored?.previousGame).toEqual(played.previousGame);
    });

    it("should return null when a saved action is not legal on that seed", () => {
      const run = toRun(playSteps(2));

      const restored = restoreSession(SEED_CONTENT, {
        ...run,
        actions: [...run.actions, { kind: "card", cardId: "no-such-card" }],
      });

      expect(restored).toBeNull();
    });
  });

  it("should return null when the replay ends the run", () => {
    const bankrupt = {
      ...SEED_CONTENT,
      events: [],
      phases: SEED_CONTENT.phases.map((phase) => ({ ...phase, passiveCosts: { revenue: -100 } })),
    };
    const first = Object.values(startSession(bankrupt, 5).game.hand ?? {})[0];

    expect(
      restoreSession(bankrupt, { version: 7, seed: 5, actions: [{ kind: "card", cardId: first }] })
    ).toBeNull();
  });

  it("should mark every step as replayed when a run is resumed", () => {
    const restored = restoreSession(SEED_CONTENT, toRun(playSteps(3)));

    expect(restored?.replayedStepCount).toBe(3);
  });

  it("should record the turn before the action and the answered event when steps are taken", () => {
    const first = startSession(SEED_CONTENT, 5);
    const cardId = Object.values(first.game.hand ?? {})[0];

    const played = applyAction(first, SEED_CONTENT, { kind: "card", cardId });

    expect(played.steps).toEqual([
      {
        action: { kind: "card", cardId },
        turn: first.game.turn,
        eventId: null,
        state: played.game,
      },
    ]);
    expect(played.previousGame).toBe(first.game);
  });

  it("should return the same session when an action is rejected", () => {
    const session = startSession(SEED_CONTENT, 5);

    expect(applyAction(session, SEED_CONTENT, { kind: "option", optionId: "x" })).toBe(session);
  });

  it("should save nothing when no action was taken or the run is over", () => {
    const fresh = startSession(SEED_CONTENT, 5);
    const over: SessionState = { ...playSteps(1), game: { ...fresh.game, status: "lost" } };

    expect(toSavedRun(fresh)).toBeNull();
    expect(toSavedRun(over)).toBeNull();
  });
});

describe("the player's app name", () => {
  it("should keep the app name through actions and the save when the run was named", () => {
    const start = startSession(SEED_CONTENT, 3, "Pixelplein");
    const cardId = start.game.hand?.[0] ?? "";
    const played = applyAction(start, SEED_CONTENT, { kind: "card", cardId });

    expect(played.appName).toBe("Pixelplein");
    const saved = toSavedRun(played);
    expect(saved?.appName).toBe("Pixelplein");
    expect(saved && restoreSession(SEED_CONTENT, saved)?.appName).toBe("Pixelplein");
  });

  it("should store no name when the run was started without one", () => {
    const start = startSession(SEED_CONTENT, 3);
    const cardId = start.game.hand?.[0] ?? "";
    const saved = toSavedRun(applyAction(start, SEED_CONTENT, { kind: "card", cardId }));

    expect(saved).not.toBeNull();
    expect(saved && "appName" in saved).toBe(false);
  });
});
