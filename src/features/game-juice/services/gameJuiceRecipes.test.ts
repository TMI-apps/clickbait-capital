import { describe, expect, it } from "vitest";
import { SOUND_EFFECT_IDS } from "@/features/game-audio/api";
import { JUICE_LIMITS, juiceRecipeSteps, type JuiceStepData } from "@/features/juice-engine/api";
import type { JuiceEffectStep } from "@/features/juice-effects/api";
import { GAME_JUICE_RECIPES } from "@/features/game-juice/services/gameJuiceRecipes";
import {
  GAME_JUICE_BOOK,
  createGameJuiceEffects,
} from "@/features/game-juice/services/gameJuiceRuntime";

const EFFECTS = createGameJuiceEffects(() => undefined);

/** Every branch of every recipe: `[event, branch, steps]`. */
const BRANCHES: Array<[string, string, JuiceStepData[]]> = Object.entries(GAME_JUICE_BOOK).flatMap(
  ([event, recipe]) => [
    [event, "steps", recipe.steps ?? []] as [string, string, JuiceStepData[]],
    ...Object.entries(recipe.variants ?? {}).map(
      ([variant, steps]) => [event, variant, steps] as [string, string, JuiceStepData[]]
    ),
  ]
);
const ALL_STEPS = BRANCHES.flatMap(([, , steps]) => steps);

/**
 * Ethics stays dull (design § 5, game-juice D8): news and journalism may only sound, mark a
 * meter with a still badge, or nothing at all.
 */
const DULL_BRANCHES: Array<[string, string]> = [
  ["card.played", "news"],
  ["event.resolved", "journalism"],
  ["event.outcome", "journalism"],
  ["outcome.row", "dull"],
  ["feed.landed", "news"],
  ["meter.changed", "dull"],
];
const DULL_EFFECTS = new Set(["sound", "badge"]);

/** A dull entrance: a short linear slide, no scale, no overshoot (design § 5 "kort en droog"). */
const isDryEntrance = (step: JuiceStepData): boolean =>
  step.effect === "enter" && step.easing === "linear" && step.scale === 1;

describe("GAME_JUICE_RECIPES", () => {
  it("should name only effects the game registry provides when steps are listed", () => {
    const unknown = ALL_STEPS.filter((step) => !EFFECTS[step.effect]).map((step) => step.effect);
    expect(unknown).toEqual([]);
  });

  it("should play only sounds that exist in game-audio when a step is a sound", () => {
    const ids = ALL_STEPS.filter((step) => step.effect === "sound").map((step) => step.id);
    expect(ids.filter((id) => !(SOUND_EFFECT_IDS as readonly unknown[]).includes(id))).toEqual([]);
  });

  it("should keep every numeric param inside its effect's range when recipes ship", () => {
    const outOfRange = ALL_STEPS.flatMap((step) =>
      Object.entries(EFFECTS[step.effect]?.params ?? {}).flatMap(([param, spec]) => {
        const value = step[param];
        return typeof value === "number" && (value < spec.min || value > spec.max)
          ? [`${step.effect}.${param}=${value}`]
          : [];
      })
    );
    expect(outOfRange).toEqual([]);
  });

  it("should keep news and journalism dull when those branches play", () => {
    for (const [event, variant] of DULL_BRANCHES) {
      const recipe = GAME_JUICE_BOOK[event];
      const loud = juiceRecipeSteps(recipe, variant).filter(
        (step) => !DULL_EFFECTS.has(step.effect) && !isDryEntrance(step)
      );
      expect(loud.map((step) => `${event}/${variant}: ${step.effect}`)).toEqual([]);
    }
  });

  it("should give an answered event the same visuals as the card of its kind when it resolves", () => {
    const cards = GAME_JUICE_RECIPES["card.played"].variants;
    const events = GAME_JUICE_RECIPES["event.resolved"].variants;
    const visuals = (steps: JuiceEffectStep[] = []) =>
      steps.filter((step) => step.effect !== "sound" && step.effect !== "haptic");
    expect(events?.engagement).toEqual(visuals(cards?.viral));
    expect(events?.commercial).toEqual(visuals(cards?.ad));
    expect(events?.journalism).toEqual(visuals(cards?.news));
  });

  it("should never ask for more particles than the stage keeps alive when a recipe throws them", () => {
    const counts = ALL_STEPS.filter((step) => step.effect === "particles").map((step) =>
      Number(step.count)
    );
    expect(Math.max(...counts)).toBeLessThanOrEqual(JUICE_LIMITS.liveParticles);
  });

  it("should keep every screen flash within the screen opacity limit when a recipe flashes", () => {
    const screen = ALL_STEPS.filter(
      (step) => EFFECTS[step.effect]?.flashes(step) && typeof step.opacity === "number"
    );
    expect(screen.every((step) => Number(step.opacity) <= JUICE_LIMITS.screenOpacity)).toBe(true);
  });

  it("should play every milestone sound 250 ms after the action sound when a milestone follows an action", () => {
    for (const event of ["phase.up", "run.won", "run.lost", "event.appeared"] as const) {
      const sound = GAME_JUICE_RECIPES[event].steps?.find((step) => step.effect === "sound");
      expect(sound?.at, event).toBe(250);
    }
  });

  it("should start every step that uses the origin at once when the origin is a played card", () => {
    // The played card leaves the draft right after the play, so a delayed step would lose it.
    const delayed = ALL_STEPS.filter(
      (step) => (step.target === "origin" || step.from === "origin") && (step.at ?? 0) > 0
    );
    expect(delayed).toEqual([]);
  });
});
