import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { GameState } from "@/features/game-engine/api";
import {
  SEED_CONTENT,
  createGame,
  getPendingEvent,
  playCard,
  resolveEvent,
} from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/api";
import { readSavedRun } from "@/features/game-save/api";
import { useGameSession } from "@/features/game-board/hooks/useGameSession";

type Session = ReturnType<typeof useGameSession>;

/** One step of a scripted player: answer an event with its first option, else play `pick`. */
const step = (session: Session, pick: (session: Session) => string): void => {
  if (session.view.event) {
    session.chooseOption(session.view.event.options[0].id);
    return;
  }
  session.play(pick(session));
};

const playUntilEnd = (
  result: { current: Session },
  pick: (session: Session) => string,
  maxSteps = 500
): number => {
  let steps = 0;
  while (result.current.view.end === null && steps < maxSteps) {
    act(() => step(result.current, pick));
    steps += 1;
  }
  return steps;
};

/** Same scoring as game-content's balance simulation "mixed" player (one-step lookahead). */
function scoreState(state: GameState): number {
  if (state.status === "lost") return -100_000;
  if (state.status === "won") return 100_000;
  const { revenue, users, reputation } = state.meters;
  const ipoPush = state.phase === 4 ? Math.min(revenue, 90) + Math.min(reputation, 70) : 0;
  return (
    state.phase * 1_000 +
    state.goalStreak * 20 +
    Math.log10(state.stats.users + 1) * 40 +
    Math.min(revenue, users, reputation) * 3 +
    (revenue + users + reputation) * 0.5 +
    ipoPush -
    state.toxicity * 0.4
  );
}

/** The careful player's next choice: an event option id or a card id. */
function carefulChoice(state: GameState): string {
  const best = (ids: string[], next: (id: string) => GameState): string =>
    ids.map((id) => ({ id, score: scoreState(next(id)) })).sort((a, b) => b.score - a.score)[0].id;
  if (state.status === "event") {
    const options = getPendingEvent(state, GAME_CONTENT)?.options ?? [];
    return best(
      options.map((option) => option.id),
      (id) => resolveEvent(state, GAME_CONTENT, id)
    );
  }
  return best(Object.values(state.hand ?? {}), (id) => playCard(state, GAME_CONTENT, id));
}

/** First seed the careful player wins with the engine alone (the run to replay in the hook). */
function findWinningSeed(): number {
  for (let seed = 1; seed < 400; seed += 1) {
    let state = createGame({ content: GAME_CONTENT, seed });
    for (
      let step = 0;
      step < 600 && (state.status === "playing" || state.status === "event");
      step++
    ) {
      const choice = carefulChoice(state);
      state =
        state.status === "event"
          ? resolveEvent(state, GAME_CONTENT, choice)
          : playCard(state, GAME_CONTENT, choice);
    }
    if (state.status === "won") return seed;
  }
  throw new Error("no winning seed found");
}

describe("useGameSession", () => {
  describe("acceptance", () => {
    it("should reach a game end and fill the feed when a scripted player plays the draft", () => {
      const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));
      const firstCard = (session: Session): string => session.view.draft[0].id;

      playUntilEnd(result, firstCard);

      const { view, status } = result.current;
      expect(view.end).not.toBeNull();
      expect(["won", "lost"]).toContain(status);
      expect(view.draft).toEqual([]);
      expect(view.feed.length).toBeGreaterThan(0);
      expect(new Set(view.feed.map((entry) => entry.key)).size).toBe(view.feed.length);
    });

    it("should start a fresh playing run when restart is called after the end", () => {
      const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));
      playUntilEnd(result, (session) => session.view.draft[0].id);

      act(() => result.current.restart());

      expect(result.current.status).toBe("playing");
      expect(result.current.view.feed).toEqual([]);
      expect(result.current.view.draft).toHaveLength(3);
      expect(result.current.view.meters.map((meter) => meter.value)).toEqual([50, 50, 50]);
    });
  });

  it("should show the IPO win when a careful player wins with the real content", () => {
    const seed = findWinningSeed();
    const { result } = renderHook(() => useGameSession({ content: GAME_CONTENT, seed }));
    // Mirror the hook's state with the engine to choose like the careful player.
    let mirror = createGame({ content: GAME_CONTENT, seed });
    for (let step = 0; step < 600 && result.current.view.end === null; step++) {
      const choice = carefulChoice(mirror);
      const isEvent = mirror.status === "event";
      mirror = isEvent
        ? resolveEvent(mirror, GAME_CONTENT, choice)
        : playCard(mirror, GAME_CONTENT, choice);
      act(() => (isEvent ? result.current.chooseOption(choice) : result.current.play(choice)));
    }

    expect(result.current.status).toBe("won");
    expect(result.current.view.end).toMatchObject({ outcome: "won", reason: null, phaseId: 4 });
    expect(result.current.view.phase.phaseId).toBe(4);
  });

  it("should put the played card on top of the feed and report meter deltas when a card is played", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    const ad = result.current.view.draft.find((card) => card.type === "ad");
    expect(ad).toBeDefined();

    act(() => result.current.play(ad?.id ?? ""));

    const { view } = result.current;
    expect(view.feed[0]).toMatchObject({ type: "ad", title: ad?.title });
    const revenue = view.meters.find((meter) => meter.key === "revenue");
    expect(revenue?.delta).toBe((revenue?.value ?? 0) - 50);
    expect(revenue?.delta).not.toBe(0);
  });

  it("should ignore a card that is not in the open draft when play is called", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    const before = result.current.view;

    act(() => result.current.play("does-not-exist"));

    expect(result.current.view).toBe(before);
  });
});

describe("useGameSession saving on the device", () => {
  it("should save the seed and actions when a card is played", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    const card = result.current.view.draft[0].id;

    act(() => result.current.play(card));

    expect(readSavedRun()).toEqual({
      version: 1,
      seed: 3,
      actions: [{ kind: "card", cardId: card }],
    });
  });

  it("should resume the identical board when a saved run is passed", () => {
    const first = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    for (let count = 0; count < 4; count++) {
      act(() => step(first.result.current, (session) => session.view.draft[0].id));
    }
    const before = first.result.current.view;
    first.unmount();

    const { result } = renderHook(() =>
      useGameSession({ content: SEED_CONTENT, savedRun: readSavedRun() })
    );

    expect(result.current.resumed).toBe(true);
    expect(result.current.view).toEqual(before);
  });

  it("should start a new run when the saved run no longer replays", () => {
    const { result } = renderHook(() =>
      useGameSession({
        content: SEED_CONTENT,
        seed: 3,
        savedRun: { version: 1, seed: 3, actions: [{ kind: "card", cardId: "gone" }] },
      })
    );

    expect(result.current.resumed).toBe(false);
    expect(result.current.view.feed).toEqual([]);
    expect(readSavedRun()).toBeNull();
  });

  it("should clear the save when the run ends", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 7 }));

    playUntilEnd(result, (session) => session.view.draft[0].id);

    expect(result.current.view.end).not.toBeNull();
    expect(readSavedRun()).toBeNull();
  });

  it("should clear the save when the run restarts", () => {
    const { result } = renderHook(() => useGameSession({ content: SEED_CONTENT, seed: 3 }));
    act(() => result.current.play(result.current.view.draft[0].id));

    act(() => result.current.restart());

    expect(readSavedRun()).toBeNull();
  });
});
