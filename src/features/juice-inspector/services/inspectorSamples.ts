import type { JuicePayload, JuiceRecipeBook } from "@/features/juice-engine/api";
import type {
  InspectorAnchorNames,
  InspectorEntry,
} from "@/features/juice-inspector/types/juiceInspector.types";

/** The mock board's anchors (`InspectorStage` registers them under these names). */
export const INSPECTOR_ANCHORS: InspectorAnchorNames = {
  board: "board",
  card: "inspector:card",
  chart: "chart",
  feed: "feed:newest",
  button: "button",
  outcomes: ["outcome:users", "outcome:revenue", "outcome:reputation"],
  endScreen: "end-screen",
  meters: ["meter:users", "meter:revenue", "meter:reputation"],
};

/** Template vars a sample event carries, so templated targets and texts resolve on the mock board. */
const SAMPLE_VARS: Record<string, Record<string, string | number>> = {
  "meter.changed": { meter: "users", text: "+1.250" },
  "outcome.row": { row: "outcome:users" },
};

/** Every event and variant in the recipe book, in book order (new recipes appear by themselves). */
export function inspectorEntries(book: JuiceRecipeBook): InspectorEntry[] {
  return Object.entries(book).flatMap(([event, recipe]): InspectorEntry[] => {
    const domain = event.split(".")[0];
    const variants = Object.keys(recipe.variants ?? {});
    if (variants.length === 0) return [{ event, variant: null, label: event, domain }];
    return variants.map((variant) => ({ event, variant, label: `${event} · ${variant}`, domain }));
  });
}

/** The payload a trigger button emits: its variant, the mock card as origin, sample vars. */
export function inspectorPayload(entry: InspectorEntry, origin: Element | null): JuicePayload {
  return {
    variant: entry.variant ?? undefined,
    origin,
    vars: SAMPLE_VARS[entry.event],
  };
}
