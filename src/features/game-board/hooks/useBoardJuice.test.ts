import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { gameJuiceBus, type GameJuiceEmit } from "@/features/game-juice/api";
import {
  useBoardFollowUp,
  useBoardReveal,
  useCommentArrivals,
  useScandalWarningJuice,
} from "@/features/game-board/hooks/useBoardJuice";
import type { BoardJuice } from "@/features/game-board/services/boardJuice";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

let heard: string[] = [];
let stopped: string[] = [];
let stop: () => void = () => undefined;
beforeEach(() => {
  heard = [];
  stopped = [];
  const unlisten = gameJuiceBus.listen((name, payload) =>
    heard.push(payload.variant ? `${name}:${payload.variant}` : name)
  );
  const unlistenStop = gameJuiceBus.listenStop((tag) => stopped.push(tag));
  stop = () => {
    unlisten();
    unlistenStop();
  };
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
    expect(heard).toEqual(["feed.landed:viral"]);
  });

  it("should not reveal the action present at mount when the board returns from a phase intro", () => {
    renderHook((props) => useBoardReveal(props), {
      initialProps: { key: 5, reveal: [LANDED], meters: meters(10), hold: false },
    });
    expect(heard).toEqual([]);
  });
});

describe("useBoardReveal moments", () => {
  it("should play the goal reached with the reveal when a tile reaches its goal line", () => {
    const tile = (full: boolean): MeterView[] => [
      { key: "users", full, danger: false } as MeterView,
    ];
    const { rerender } = renderHook((props) => useBoardReveal(props), {
      initialProps: { key: 1, reveal: [], meters: tile(false), hold: false },
    });
    rerender({ key: 2, reveal: [], meters: tile(true), hold: false });
    rerender({ key: 3, reveal: [], meters: tile(true), hold: false });
    expect(heard).toEqual(["goal.reached"]);
  });
});

describe("useScandalWarningJuice", () => {
  it("should stay quiet at mount, ramp when the level rises and stop when the warning goes", () => {
    const { rerender } = renderHook((scandal) => useScandalWarningJuice(scandal), {
      initialProps: { chance: 0.3, text: "" } as { chance: number; text: string } | null,
    });
    expect(heard).toEqual([]);
    rerender({ chance: 0.6, text: "" });
    rerender({ chance: 0.3, text: "" });
    rerender(null);
    expect(heard).toEqual(["scandal.warning:3"]);
    expect(stopped).toEqual(["scandal-warning"]);
  });
});

describe("useCommentArrivals", () => {
  it("should pop each new comment but not the comments shown at mount", () => {
    const { rerender } = renderHook(({ key, shown }) => useCommentArrivals(key, shown), {
      initialProps: { key: 1 as number | null, shown: 3 },
    });
    rerender({ key: 2, shown: 0 });
    rerender({ key: 2, shown: 1 });
    rerender({ key: 2, shown: 2 });
    expect(heard).toEqual(["comment.arrived", "comment.arrived"]);
  });
});
