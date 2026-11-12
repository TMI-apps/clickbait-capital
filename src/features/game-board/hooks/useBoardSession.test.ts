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
import { useBoardSession } from "@/features/game-board/hooks/useBoardSession";

type Session = ReturnType<typeof useBoardSession>;

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

/** A simplified balance-simulation "mixed" player (one-step lookahead on the score). */
function scoreState(state: GameState): number {
  if (state.status === "lost") return -100_000;
  if (state.status === "won") return 100_000;
  const phase = GAME_CONTENT.phases.find((candidate) => candidate.id === state.phase)!;
  const users = Math.min(1, state.users / phase.goal.users);
  const money = Math.min(1, Math.max(0, state.money) / phase.goal.money);
  return (
    state.phase * 1_000 +
    (users + money) * 300 +
    Math.min(users, money) * 300 +
    state.reputation * 2 -
    state.toxicity
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

describe("useBoardSession", () => {
  describe("acceptance", () => {
    it("should reach a game end and fill the feed when a scripted player plays the draft", () => {
      const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 7 }));
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
      const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 7 }));
      playUntilEnd(result, (session) => session.view.draft[0].id);

      act(() => result.current.restart());

      expect(result.current.status).toBe("playing");
      expect(result.current.view.feed).toEqual([]);
      expect(result.current.view.draft).toHaveLength(3);
      expect(result.current.view.meters.map((meter) => meter.amount)).toEqual([
        SEED_CONTENT.balance.startUsers,
        SEED_CONTENT.balance.startMoney,
      ]);
    });
  });

  it("should show the IPO win when a careful player wins with the real content", () => {
    const seed = findWinningSeed();
    const { result } = renderHook(() => useBoardSession({ content: GAME_CONTENT, seed }));
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

  it("should put the played card on top of the feed and report the money change when a card is played", () => {
    const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    const ad = result.current.view.draft.find((card) => card.type === "ad");
    expect(ad).toBeDefined();

    act(() => result.current.play(ad?.id ?? ""));

    const { view } = result.current;
    expect(view.feed[0]).toMatchObject({ type: "ad", title: ad?.title });
    const revenue = view.meters.find((meter) => meter.key === "revenue");
    expect(revenue?.delta).toBe((revenue?.amount ?? 0) - SEED_CONTENT.balance.startMoney);
    expect(revenue?.delta).not.toBe(0);
  });

  it("should ignore a card that is not in the open draft when play is called", () => {
    const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    const before = result.current.view;

    act(() => result.current.play("does-not-exist"));

    expect(result.current.view).toBe(before);
  });
});

describe("useBoardSession resume and juice", () => {
  it("should resume the identical board when a saved run is passed", () => {
    const first = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    for (let count = 0; count < 4; count++) {
      act(() => step(first.result.current, (session) => session.view.draft[0].id));
    }
    const before = first.result.current.view;
    first.unmount();

    const { result } = renderHook(() =>
      useBoardSession({ content: SEED_CONTENT, savedRun: readSavedRun() })
    );

    expect(result.current.resumed).toBe(true);
    expect(result.current.view).toEqual(before);
  });

  it("should give no juice when a run starts or resumes", () => {
    const fresh = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    expect(fresh.result.current.juice.reveal).toEqual([]);
    act(() => fresh.result.current.play(fresh.result.current.view.draft[0].id));
    fresh.unmount();

    const { result } = renderHook(() =>
      useBoardSession({ content: SEED_CONTENT, savedRun: readSavedRun() })
    );

    expect(result.current.resumed).toBe(true);
    expect(result.current.juice).toMatchObject({ followUp: [], reveal: [] });
  });

  it("should reveal the played card's post once per action when a card is played", () => {
    const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    const card = result.current.view.draft[0];
    const keyBefore = result.current.juice.key;

    act(() => result.current.play(card.id));

    expect(result.current.juice.reveal).toContainEqual({
      name: "feed.landed",
      payload: { variant: card.type },
    });
    expect(result.current.juice.key).not.toBe(keyBefore);
  });

  it("should give no juice when the run restarts", () => {
    const { result } = renderHook(() => useBoardSession({ content: SEED_CONTENT, seed: 3 }));
    act(() => result.current.play(result.current.view.draft[0].id));

    act(() => result.current.restart());

    expect(result.current.juice.reveal).toEqual([]);
  });
});
