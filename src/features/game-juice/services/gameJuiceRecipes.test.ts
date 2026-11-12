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
  ["feed.landed", "news"],
  ["meter.changed", "dull"],
];
const DULL_EFFECTS = new Set(["sound", "badge"]);

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
      const effects = juiceRecipeSteps(recipe, variant).map((step) => step.effect);
      expect(effects.filter((effect) => !DULL_EFFECTS.has(effect))).toEqual([]);
    }
  });

  it("should give an answered event the same visuals as the card of its kind", () => {
    const cards = GAME_JUICE_RECIPES["card.played"].variants;
    const events = GAME_JUICE_RECIPES["event.resolved"].variants;
    const visuals = (steps: JuiceEffectStep[] = []) =>
      steps.filter((step) => step.effect !== "sound" && step.effect !== "haptic");
    expect(events?.engagement).toEqual(visuals(cards?.viral));
    expect(events?.commercial).toEqual(visuals(cards?.ad));
    expect(events?.journalism).toEqual(visuals(cards?.news));
  });

  it("should never ask for more particles than the stage keeps alive", () => {
    const counts = ALL_STEPS.filter((step) => step.effect === "particles").map((step) =>
      Number(step.count)
    );
    expect(Math.max(...counts)).toBeLessThanOrEqual(JUICE_LIMITS.liveParticles);
  });

  it("should keep every screen flash within the screen opacity limit", () => {
    const screen = ALL_STEPS.filter(
      (step) => EFFECTS[step.effect]?.flashes(step) && typeof step.opacity === "number"
    );
    expect(screen.every((step) => Number(step.opacity) <= JUICE_LIMITS.screenOpacity)).toBe(true);
  });
});
