import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { SEED_CONTENT, getPendingEvent } from "@/features/game-engine/api";
import { readSavedRun } from "@/features/game-save/api";
import { useGameSession } from "@/features/game-session/api";
import type { GameSession } from "@/features/game-session/api";

/** One step of a simple player: first option of a pending event, else the first hand card. */
const step = (run: GameSession): void => {
  const { game } = run.session;
  if (game.status === "event") {
    run.chooseOption(getPendingEvent(game, SEED_CONTENT)?.options[0].id ?? "");
    return;
  }
  run.play(Object.values(game.hand ?? {})[0]);
};

const isOver = (run: GameSession): boolean => run.status === "won" || run.status === "lost";

const playUntilEnd = (result: { current: GameSession }, maxSteps = 500): void => {
  for (let count = 0; !isOver(result.current) && count < maxSteps; count++) {
    act(() => step(result.current));
  }
};

const firstHandCard = (run: GameSession): string => Object.values(run.session.game.hand ?? {})[0];

describe("useGameSession", () => {
  describe("acceptance", () => {
    it("should reach a game end and record every accepted step when a scripted player plays", () => {
      const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));

      playUntilEnd(result);

      const { session, status } = result.current;
      expect(["won", "lost"]).toContain(status);
      expect(session.steps.length).toBeGreaterThan(0);
      expect(session.previousGame).not.toBeNull();
      expect(session.replayedStepCount).toBe(0);
    });

    it("should start a fresh playing run when restart is called after the end", () => {
      const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));
      playUntilEnd(result);

      act(() => result.current.restart());

      const { session, status } = result.current;
      expect(status).toBe("playing");
      expect(session.steps).toEqual([]);
      expect(session.previousGame).toBeNull();
      expect(session.game).toMatchObject({
        users: SEED_CONTENT.balance.startUsers,
        money: SEED_CONTENT.balance.startMoney,
      });
    });
  });

  it("should keep the same session when a card is not in the open draft", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    const before = result.current.session;

    act(() => result.current.play("does-not-exist"));

    expect(result.current.session).toBe(before);
  });
});

describe("useGameSession saving on the device", () => {
  it("should save the seed and actions when a card is played", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    const card = firstHandCard(result.current);

    act(() => result.current.play(card));

    expect(readSavedRun()).toEqual({
      version: 5,
      seed: 3,
      actions: [{ kind: "card", cardId: card }],
    });
  });

  it("should resume the identical run when a saved run is passed", () => {
    const first = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    for (let count = 0; count < 4; count++) {
      act(() => step(first.result.current));
    }
    const before = first.result.current.session;
    first.unmount();

    const { result } = renderHook(() =>
      useGameSession({ content: SEED_CONTENT, savedRun: readSavedRun() })
    );

    const { session, resumed } = result.current;
    expect(resumed).toBe(true);
    expect(session.game).toEqual(before.game);
    expect(session.previousGame).toEqual(before.previousGame);
    expect(session.steps).toEqual(before.steps);
    expect(session.replayedStepCount).toBe(before.steps.length);
  });

  it("should start a new run when the saved run no longer replays", () => {
    const { result } = renderHook(() =>
      useGameSession({
        content: SEED_CONTENT,
        seed: 3,
        savedRun: { version: 5, seed: 3, actions: [{ kind: "card", cardId: "gone" }] },
      })
    );

    expect(result.current.resumed).toBe(false);
    expect(result.current.session.steps).toEqual([]);
    expect(readSavedRun()).toBeNull();
  });

  it("should clear the save when the run ends", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));

    playUntilEnd(result);

    expect(isOver(result.current)).toBe(true);
    expect(readSavedRun()).toBeNull();
  });

  it("should clear the save when the run restarts", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    act(() => result.current.play(firstHandCard(result.current)));

    act(() => result.current.restart());

    expect(readSavedRun()).toBeNull();
  });
});
