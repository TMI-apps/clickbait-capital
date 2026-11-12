import type { JuiceEventMap, JuicePayload } from "@/features/juice-engine/types/juiceEngine.types";

/** Receives every emitted event: the director plays it, the inspector logs it. */
export type JuiceListener = (name: string, payload: JuicePayload) => void;

export interface JuiceBus<E extends JuiceEventMap> {
  /** Announces a moment. Never throws; with no listener (root not mounted yet) it is dropped. */
  emit: <K extends keyof E & string>(name: K, payload?: E[K]) => void;
  /** Subscribes to every event; returns the unsubscribe. */
  listen: (listener: JuiceListener) => () => void;
}

/**
 * The typed event bus gameplay talks to (juice-core D1): `emit("card.played", { variant })`
 * instead of calling effects. Synchronous fan-out; a failing listener never breaks gameplay.
 */
export function createJuiceBus<E extends JuiceEventMap>(): JuiceBus<E> {
  const listeners = new Set<JuiceListener>();

  const emit = <K extends keyof E & string>(name: K, payload?: E[K]): void => {
    const data: JuicePayload = payload ?? {};
    listeners.forEach((listener) => {
      try {
        listener(name, data);
      } catch (error: unknown) {
        // Juice is never load-bearing: report in dev and keep playing.
        if (import.meta.env.DEV) console.warn(`[juice] listener failed for ${name}`, error);
      }
    });
  };

  const listen = (listener: JuiceListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { emit, listen };
}
