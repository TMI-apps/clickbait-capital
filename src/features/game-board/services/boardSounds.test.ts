import { describe, expect, it } from "vitest";
import { createGame, SEED_CONTENT, type GameState } from "@/features/game-engine/api";
import { METER_CUE_THRESHOLD, soundsForAction } from "./boardSounds";

const base = (): GameState => createGame({ content: SEED_CONTENT, seed: 1 });

const withChanges = (state: GameState, changes: Partial<GameState>): GameState => ({
  ...state,
  ...changes,
});

describe("soundsForAction", () => {
  it("should play only the card type sound when nothing else changed", () => {
    const before = base();

    expect(soundsForAction({ cardType: "news", before, after: before })).toEqual(["card-news"]);
  });

  it("should follow an event answer with nothing when meters barely moved", () => {
    const before = withChanges(base(), { status: "event" });
    const after = withChanges(base(), { status: "playing" });

    expect(soundsForAction({ cardType: null, before, after })).toEqual(["event-choice"]);
  });

  it("should add one loss blip when a number falls past the threshold share", () => {
    const before = base();
    const after = withChanges(before, {
      users: Math.round(before.users * (1 + METER_CUE_THRESHOLD)),
      money: Math.round(before.money * (1 - METER_CUE_THRESHOLD)),
    });

    expect(soundsForAction({ cardType: "viral", before, after })).toEqual([
      "card-viral",
      "meter-loss",
    ]);
  });

  it("should add a gain blip when a number rises past the threshold share", () => {
    const before = base();
    const after = withChanges(before, {
      money: Math.round(before.money * (1 + METER_CUE_THRESHOLD)),
    });

    expect(soundsForAction({ cardType: "ad", before, after })).toEqual(["card-ad", "meter-gain"]);
  });

  it("should prefer the event sting over a meter blip when an event appears", () => {
    const before = base();
    const after = withChanges(before, {
      status: "event",
      money: before.money * 2,
    });

    expect(soundsForAction({ cardType: "ad", before, after })).toEqual(["card-ad", "event-appear"]);
  });

  it("should play the phase-up sound when the phase advances", () => {
    const before = base();
    const after = withChanges(before, { phase: 2 });

    expect(soundsForAction({ cardType: "viral", before, after })).toEqual([
      "card-viral",
      "phase-up",
    ]);
  });

  it("should end with game-over or ipo-win when the run ends", () => {
    const before = base();

    expect(
      soundsForAction({ cardType: "ad", before, after: withChanges(before, { status: "lost" }) })
    ).toEqual(["card-ad", "game-over"]);
    expect(
      soundsForAction({ cardType: null, before, after: withChanges(before, { status: "won" }) })
    ).toEqual(["event-choice", "ipo-win"]);
  });
});
