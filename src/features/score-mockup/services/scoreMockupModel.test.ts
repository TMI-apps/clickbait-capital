import { describe, expect, it } from "vitest";
import {
  advanceTurn,
  createScoreState,
  DEMO_SCRIPT,
  forecast,
  mockHand,
  reputationLevel,
} from "@/features/score-mockup/services/scoreMockupModel";
import type { MockCardKind, ScoreState } from "@/features/score-mockup/types/scoreMockup.types";

function play(state: ScoreState, kind: MockCardKind): ScoreState {
  return advanceTurn(state, mockHand(state.turn).find((card) => card.kind === kind)!);
}

describe("scoreMockupModel", () => {
  it("should move users gradually when a viral card is played", () => {
    const start = createScoreState();
    const next = play(start, "viral");
    expect(next.users).toBeGreaterThan(start.users);
    // A burst, not a jump: one turn adds well under half the users.
    expect(next.users).toBeLessThan(start.users * 1.3);
  });

  it("should keep growing for a few turns when the viral momentum fades", () => {
    const afterViral = play(createScoreState(), "viral");
    const passive = advanceTurn(afterViral, null);
    expect(passive.lastTurn!.growth).toBeGreaterThan(0);
    expect(passive.lastTurn!.growth).toBeLessThan(afterViral.lastTurn!.growth);
  });

  it("should earn more money but grow slower when an ad is played instead of a viral card", () => {
    const start = createScoreState();
    const ad = play(start, "ad");
    const viral = play(start, "viral");
    expect(ad.lastTurn!.profit).toBeGreaterThan(viral.lastTurn!.profit);
    expect(ad.lastTurn!.growth).toBeLessThan(viral.lastTurn!.growth);
  });

  it("should forecast the same first point as playing the card", () => {
    const start = createScoreState();
    const card = mockHand(0)[0]!;
    const [first] = forecast(start, card);
    const played = advanceTurn(start, card);
    expect(first).toEqual({ users: played.users, money: played.money });
  });

  it("should enter the danger zone and hit both numbers when the demo chases growth", () => {
    let state = createScoreState();
    const levels = DEMO_SCRIPT.map((kind) => {
      state = play(state, kind);
      return reputationLevel(state.reputation);
    });
    expect(levels).toContain("danger");
    expect(levels[levels.length - 1]).not.toBe("danger");
  });
});
