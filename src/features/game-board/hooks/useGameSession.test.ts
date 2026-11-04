import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { SEED_CONTENT } from "@/features/game-engine/api";
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
