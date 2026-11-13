import { describe, expect, it } from "vitest";
import { createGame, SEED_CONTENT, type GameState } from "@/features/game-engine/api";
import {
  METER_CUE_THRESHOLD,
  juiceForAction,
  meterMoments,
  scandalLevel,
  scandalWarningJuice,
  type BoardJuiceAction,
  type BoardMomentMeter,
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

/** A line whose history (shares of the goal) ends with the given points. */
const line = (key: BoardJuiceMeter["key"], history: number[]): BoardJuiceMeter => ({
  ...moved(key, 0.01),
  history,
});

const lineEmits = (emits: ReturnType<typeof juiceForAction>["reveal"]): string[] =>
  emits.flatMap((emit) => {
    if (emit.name === "chart.moved") return [`chart.moved ${emit.payload.variant}`];
    if (emit.name === "streak.step") return [`streak.step ${emit.payload.variant}`];
    if (emit.name === "streak.broken") return [`streak.broken ${emit.payload.vars.count}`];
    return [];
  });

describe("juiceForAction chart and streaks", () => {
  it("should tier each line's move by its share of the goal when the lines move", () => {
    const juice = juiceForAction(
      action({ meters: [line("users", [0.1, 0.12]), line("revenue", [0.5, 0.05])] })
    );
    expect(lineEmits(juice.reveal)).toEqual(["chart.moved up-small", "chart.moved down-huge"]);
  });

  it("should step the streak from three ups in a row and break it when the line falls", () => {
    const step = juiceForAction(action({ meters: [line("users", [0.1, 0.2, 0.3, 0.4, 0.5])] }));
    expect(lineEmits(step.reveal)).toEqual(["chart.moved up-medium", "streak.step 4"]);
    const broken = juiceForAction(action({ meters: [line("users", [0.1, 0.2, 0.3, 0.4, 0.38])] }));
    expect(lineEmits(broken.reveal)).toEqual(["chart.moved down-small", "streak.broken 3"]);
  });

  it("should keep the chart dry and the streak quiet when a news card moves the line", () => {
    const juice = juiceForAction(
      action({ cardType: "news", meters: [line("users", [0.1, 0.2, 0.3, 0.4])] })
    );
    expect(lineEmits(juice.reveal)).toEqual(["chart.moved dull"]);
  });

  it("should not draw the chart but still end a streak when a line stays flat", () => {
    const flat = juiceForAction(action({ meters: [line("users", [0.1, 0.2, 0.2])] }));
    expect(lineEmits(flat.reveal)).toEqual([]);
    const ended = juiceForAction(action({ meters: [line("users", [0, 0.1, 0.2, 0.3, 0.3])] }));
    expect(lineEmits(ended.reveal)).toEqual(["streak.broken 3"]);
  });
});

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

  it("should play the scandal hit instead of the event sting when the opened event is a scandal", () => {
    const before = base();
    const juice = juiceForAction(
      action({ before, after: withChanges(before, { status: "event" }), openedScandal: true })
    );
    expect(names(juice.followUp)).toEqual(["scandal.hit"]);
  });

  it("should carry the tile's change text when a meter moves", () => {
    const juice = juiceForAction(
      action({ meters: [{ ...moved("users", 0.05), deltaText: "+50" }] })
    );
    expect(juice.reveal[0]).toEqual({
      name: "meter.changed",
      payload: { variant: "gain", vars: { meter: "users", text: "+50" } },
    });
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

const tile = (
  key: BoardMomentMeter["key"],
  flags: Partial<Omit<BoardMomentMeter, "key">> = {}
): BoardMomentMeter => ({ key, full: false, danger: false, ...flags });

describe("meterMoments", () => {
  it("should reach the goal and warn about money when the flags turn on between two boards", () => {
    const moments = meterMoments(
      [tile("users"), tile("revenue")],
      [tile("users", { full: true }), tile("revenue", { danger: true })]
    );
    expect(moments).toEqual([
      { name: "goal.reached", payload: { vars: { meter: "users" } } },
      { name: "money.danger", payload: {} },
    ]);
  });

  it("should play nothing when a tile stays full or in danger", () => {
    const board = [tile("users", { full: true }), tile("revenue", { danger: true })];
    expect(meterMoments(board, board)).toEqual([]);
  });
});

describe("scandalWarningJuice", () => {
  it("should bucket the chance per turn into three levels when a warning shows", () => {
    expect([null, { chance: 0.1 }, { chance: 0.3 }, { chance: 0.6 }].map(scandalLevel)).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("should play the new level when the warning appears or rises", () => {
    expect(scandalWarningJuice(0, 1)).toEqual({
      name: "scandal.warning",
      payload: { variant: "1" },
    });
    expect(scandalWarningJuice(1, 3)).toEqual({
      name: "scandal.warning",
      payload: { variant: "3" },
    });
  });

  it("should stop the ramp when the warning goes away and stay quiet when it falls", () => {
    expect(scandalWarningJuice(2, 0)).toBe("stop");
    expect(scandalWarningJuice(3, 2)).toBeNull();
    expect(scandalWarningJuice(0, 0)).toBeNull();
  });
});
