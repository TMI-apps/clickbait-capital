import { describe, expect, it } from "vitest";
import { createGame, SEED_CONTENT, type GameState } from "@/features/game-engine/api";
import {
  METER_CUE_THRESHOLD,
  juiceForAction,
  type BoardJuiceAction,
  type BoardJuiceMeter,
} from "@/features/game-board/services/boardJuice";

const base = (): GameState => createGame({ content: SEED_CONTENT, seed: 1 });

const withChanges = (state: GameState, changes: Partial<GameState>): GameState => ({
  ...state,
  ...changes,
});

/** A tile that moved by `share` of its old amount (1.000). */
const moved = (key: BoardJuiceMeter["key"], share: number): BoardJuiceMeter => ({
  key,
  amount: Math.round(1000 * (1 + share)),
  delta: Math.round(1000 * share),
});

const action = (overrides: Partial<BoardJuiceAction>): BoardJuiceAction => ({
  cardType: "viral",
  optionKind: null,
  before: base(),
  after: base(),
  meters: [],
  ...overrides,
});

const names = (emits: ReturnType<typeof juiceForAction>["followUp"]): string[] =>
  emits.map((emit) => emit.name);

const meterVariants = (emits: ReturnType<typeof juiceForAction>["reveal"]): string[] =>
  emits.flatMap((emit) => (emit.name === "meter.changed" ? [emit.payload.variant] : []));

describe("juiceForAction", () => {
  it("should follow with nothing and only land the post when nothing changed", () => {
    const juice = juiceForAction(action({ cardType: "news" }));
    expect(juice.followUp).toEqual([]);
    expect(names(juice.reveal)).toEqual(["feed.landed"]);
  });

  it("should flash each moved meter without a blip when the moves stay under the threshold share", () => {
    const share = METER_CUE_THRESHOLD / 2;
    const juice = juiceForAction(
      action({ meters: [moved("users", share), moved("revenue", -share)] })
    );
    expect(meterVariants(juice.reveal)).toEqual(["gain", "loss"]);
  });

  it("should give the blip to the loss when one number rises and one falls past the threshold share", () => {
    const juice = juiceForAction(
      action({
        meters: [moved("users", METER_CUE_THRESHOLD), moved("revenue", -METER_CUE_THRESHOLD)],
      })
    );
    expect(meterVariants(juice.reveal)).toEqual(["gain", "loss-big"]);
  });

  it("should give the blip to a gain when a number rises past the threshold share", () => {
    const juice = juiceForAction(
      action({ cardType: "ad", meters: [moved("revenue", METER_CUE_THRESHOLD)] })
    );
    expect(meterVariants(juice.reveal)).toEqual(["gain-big"]);
  });

  it("should play the event sting instead of a meter blip when an event appears", () => {
    const before = base();
    const juice = juiceForAction(
      action({
        before,
        after: withChanges(before, { status: "event" }),
        meters: [moved("revenue", 1)],
      })
    );
    expect(names(juice.followUp)).toEqual(["event.appeared"]);
    expect(meterVariants(juice.reveal)).toEqual(["gain"]);
  });

  it("should follow with the next phase when the phase advances", () => {
    const before = base();
    const juice = juiceForAction(action({ before, after: withChanges(before, { phase: 2 }) }));
    expect(names(juice.followUp)).toEqual(["phase.up"]);
  });

  it("should end with the run's outcome when the run ends", () => {
    const before = base();
    const lost = juiceForAction(action({ before, after: withChanges(before, { status: "lost" }) }));
    const won = juiceForAction(
      action({ cardType: null, before, after: withChanges(before, { status: "won" }) })
    );
    expect(names(lost.followUp)).toEqual(["run.lost"]);
    expect(names(won.followUp)).toEqual(["run.won"]);
  });

  it("should keep the meters dull when a news card or a journalism answer moves them", () => {
    const meters = [moved("users", 1)];
    expect(meterVariants(juiceForAction(action({ cardType: "news", meters })).reveal)).toEqual([
      "dull",
    ]);
    const journalism = juiceForAction(action({ cardType: null, optionKind: "journalism", meters }));
    expect(meterVariants(journalism.reveal)).toEqual(["dull"]);
  });

  it("should land the event post at once and reveal the option's kind later when an event is answered", () => {
    const juice = juiceForAction(action({ cardType: null, optionKind: "engagement" }));
    expect(juice.followUp).toEqual([{ name: "feed.landed", payload: { variant: "event" } }]);
    expect(juice.reveal).toEqual([{ name: "event.resolved", payload: { variant: "engagement" } }]);
  });
});
