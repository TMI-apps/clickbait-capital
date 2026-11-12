import { useSyncExternalStore } from "react";
import type { JuiceTuningStore } from "@/features/juice-engine/services/juiceTuning";
import type {
  JuiceOverrides,
  JuiceRecipeBook,
  JuiceTuning,
} from "@/features/juice-engine/types/juiceEngine.types";

export interface JuiceTuningView {
  tuning: JuiceTuning;
  book: JuiceRecipeBook;
  overrides: JuiceOverrides;
}

/** Live view of a tuning store for editors (the juice inspector). */
export function useJuiceTuning(store: JuiceTuningStore): JuiceTuningView {
  const tuning = useSyncExternalStore(store.subscribe, store.getTuning, store.getTuning);
  const book = useSyncExternalStore(store.subscribe, store.getBook, store.getBook);
  const overrides = useSyncExternalStore(store.subscribe, store.getOverrides, store.getOverrides);
  return { tuning, book, overrides };
}
