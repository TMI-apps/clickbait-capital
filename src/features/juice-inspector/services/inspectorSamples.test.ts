import { describe, expect, it } from "vitest";
import { GAME_JUICE_BOOK } from "@/features/game-juice/api";
import { fillJuiceTemplate, juiceRecipeSteps } from "@/features/juice-engine/api";
import {
  INSPECTOR_ANCHORS,
  inspectorEntries,
  inspectorPayload,
} from "@/features/juice-inspector/services/inspectorSamples";

const entries = inspectorEntries(GAME_JUICE_BOOK);
const MOCK_ANCHORS = new Set<string>([
  INSPECTOR_ANCHORS.board,
  INSPECTOR_ANCHORS.card,
  INSPECTOR_ANCHORS.chart,
  INSPECTOR_ANCHORS.feed,
  INSPECTOR_ANCHORS.button,
  ...INSPECTOR_ANCHORS.meters,
]);

describe("inspectorEntries", () => {
  it("should list every event and every variant when built from the game's recipes", () => {
    for (const [event, recipe] of Object.entries(GAME_JUICE_BOOK)) {
      const variants = Object.keys(recipe.variants ?? {});
      const listed = entries.filter((entry) => entry.event === event).map((entry) => entry.variant);
      expect(listed).toEqual(variants.length > 0 ? variants : [null]);
    }
  });

  it("should give every recipe target an anchor on the mock board when the sample plays", () => {
    const missing = entries.flatMap((entry) => {
      const payload = inspectorPayload(entry, null);
      const recipe = GAME_JUICE_BOOK[entry.event];
      return juiceRecipeSteps(recipe, entry.variant ?? undefined).flatMap((step) =>
        ["target", "from", "to"]
          .map((key) => step[key])
          .filter((ref): ref is string => typeof ref === "string")
          .map((ref) => fillJuiceTemplate(ref, payload.vars))
          .filter((ref) => ref !== "screen" && ref !== "origin" && !MOCK_ANCHORS.has(ref))
      );
    });
    expect(missing).toEqual([]);
  });
});
