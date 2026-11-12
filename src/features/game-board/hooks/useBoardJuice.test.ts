import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { gameJuiceBus, type GameJuiceEmit } from "@/features/game-juice/api";
import { useBoardFollowUp, useBoardReveal } from "@/features/game-board/hooks/useBoardJuice";
import type { BoardJuice } from "@/features/game-board/services/boardJuice";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

let heard: string[] = [];
let stop: () => void = () => undefined;
beforeEach(() => {
  heard = [];
  stop = gameJuiceBus.listen((name) => heard.push(name));
});
afterEach(() => stop());

const LANDED: GameJuiceEmit = { name: "feed.landed", payload: { variant: "viral" } };
const PHASE: GameJuiceEmit = { name: "phase.up", payload: {} };
const meters = (amount: number): MeterView[] => [{ key: "users", amount } as MeterView];

describe("useBoardFollowUp", () => {
  it("should emit the follow-up once when a new key arrives but not for the key present at mount", () => {
    const { rerender } = renderHook((juice: BoardJuice) => useBoardFollowUp(juice), {
      initialProps: { key: 3, followUp: [PHASE], reveal: [] },
    });
    expect(heard).toEqual([]);
    rerender({ key: 4, followUp: [PHASE], reveal: [] });
    rerender({ key: 4, followUp: [PHASE], reveal: [] });
    expect(heard).toEqual(["phase.up"]);
  });
});

describe("useBoardReveal", () => {
  it("should hold the previous meters and wait with the reveal when the dialog is closing", () => {
    const { result, rerender } = renderHook((props) => useBoardReveal(props), {
      initialProps: { key: 1, reveal: [LANDED], meters: meters(10), hold: false },
    });
    rerender({ key: 2, reveal: [LANDED], meters: meters(20), hold: true });
    expect(result.current.meters).toEqual(meters(10));
    expect(result.current.revealKey).toBe(1);
    expect(heard).toEqual([]);

    rerender({ key: 2, reveal: [LANDED], meters: meters(20), hold: false });
    expect(result.current.meters).toEqual(meters(20));
    expect(result.current.revealKey).toBe(2);
    expect(heard).toEqual(["feed.landed"]);
  });

  it("should not reveal the action present at mount when the board returns from a phase intro", () => {
    renderHook((props) => useBoardReveal(props), {
      initialProps: { key: 5, reveal: [LANDED], meters: meters(10), hold: false },
    });
    expect(heard).toEqual([]);
  });
});
