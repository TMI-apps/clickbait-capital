import { useEffect, useLayoutEffect, useRef } from "react";
import type { JuiceListener } from "@/features/juice-engine/services/juiceBus";
import { createJuiceDirector } from "@/features/juice-engine/services/juiceDirector";
import type { JuiceTuningStore } from "@/features/juice-engine/services/juiceTuning";
import type {
  JuiceEffectRegistry,
  JuiceGates,
} from "@/features/juice-engine/types/juiceEngine.types";

export interface UseJuiceDirectorOptions {
  /** The bus's `listen`. */
  listen: (listener: JuiceListener) => () => void;
  /** The bus's `listenStop` (tagged stops), if the caller wants them. */
  listenStop?: (listener: (tag: string) => void) => () => void;
  effects: JuiceEffectRegistry;
  tuning: JuiceTuningStore;
  /** The player's settings right now; read when each event plays. */
  gates: JuiceGates;
}

/**
 * Connects a bus to a director for the lifetime of the calling component: every emitted event
 * plays its recipe; unmounting cancels everything still running. Tuning edits made in another
 * tab (the inspector) apply live through the `storage` event.
 */
export function useJuiceDirector({
  listen,
  listenStop,
  effects,
  tuning,
  gates,
}: UseJuiceDirectorOptions): void {
  const gatesRef = useRef(gates);
  useLayoutEffect(() => {
    gatesRef.current = gates;
  }, [gates]);

  useEffect(() => {
    const director = createJuiceDirector({
      effects,
      getBook: tuning.getBook,
      getTuning: tuning.getTuning,
      getGates: () => gatesRef.current,
    });
    const unlisten = listen(director.play);
    const unlistenStop = listenStop?.(director.stop);
    const onStorage = (): void => tuning.reload();
    window.addEventListener("storage", onStorage);
    return () => {
      unlisten();
      unlistenStop?.();
      window.removeEventListener("storage", onStorage);
      director.cancelAll();
    };
  }, [listen, listenStop, effects, tuning]);
}
