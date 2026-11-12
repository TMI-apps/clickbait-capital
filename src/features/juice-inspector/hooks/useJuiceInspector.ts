import { useCallback, useMemo, useState } from "react";
import {
  createGameJuiceEffects,
  gameJuiceBus,
  getGameJuiceTuning,
} from "@/features/game-juice/api";
import {
  findJuiceAnchor,
  useJuiceTuning,
  type JuiceEffectRegistry,
  type JuicePayload,
  type JuiceTuningStore,
  type JuiceTuningView,
} from "@/features/juice-engine/api";
import {
  useJuiceEventLog,
  type JuiceLogEntry,
} from "@/features/juice-inspector/hooks/useJuiceEventLog";
import {
  INSPECTOR_ANCHORS,
  inspectorEntries,
  inspectorPayload,
} from "@/features/juice-inspector/services/inspectorSamples";
import type {
  InspectorAnchorNames,
  InspectorEntry,
} from "@/features/juice-inspector/types/juiceInspector.types";

export interface JuiceInspectorState {
  store: JuiceTuningStore;
  view: JuiceTuningView;
  entries: InspectorEntry[];
  /** The effect registry, read for each effect's tunable params. */
  effects: JuiceEffectRegistry;
  anchors: InspectorAnchorNames;
  selected: InspectorEntry | null;
  /** Emits the entry's event on the game's bus (the real director plays it) and selects it. */
  trigger: (entry: InspectorEntry) => void;
  log: JuiceLogEntry[];
}

/** Everything the juice inspector shows and does, on the game's own bus and tuning store. */
export function useJuiceInspector(): JuiceInspectorState {
  const store = getGameJuiceTuning();
  const view = useJuiceTuning(store);
  const entries = useMemo(() => inspectorEntries(view.book), [view.book]);
  const effects = useMemo(() => createGameJuiceEffects(() => undefined), []);
  const [selected, setSelected] = useState<InspectorEntry | null>(null);
  const log = useJuiceEventLog(gameJuiceBus.listen);

  const trigger = useCallback((entry: InspectorEntry) => {
    setSelected(entry);
    const payload = inspectorPayload(entry, findJuiceAnchor(INSPECTOR_ANCHORS.card));
    // The inspector replays any recipe by name, so it emits outside the typed catalog.
    const emit = gameJuiceBus.emit as (name: string, data: JuicePayload) => void;
    emit(entry.event, payload);
  }, []);

  return { store, view, entries, effects, anchors: INSPECTOR_ANCHORS, selected, trigger, log };
}
