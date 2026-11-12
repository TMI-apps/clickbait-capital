import type { JuiceEventMap, JuicePayload } from "@/features/juice-engine/types/juiceEngine.types";

/** Receives every emitted event: the director plays it, the inspector logs it. */
export type JuiceListener = (name: string, payload: JuicePayload) => void;

/** The payload argument: optional when every field of the event's payload is optional. */
export type JuiceEmitArgs<P> = Record<string, never> extends P ? [payload?: P] : [payload: P];

export interface JuiceBus<E extends JuiceEventMap> {
  /** Announces a moment. Never throws; with no listener (root not mounted yet) it is dropped. */
  emit: <K extends keyof E & string>(name: K, ...args: JuiceEmitArgs<E[K]>) => void;
  /** Subscribes to every event; returns the unsubscribe. */
  listen: (listener: JuiceListener) => () => void;
  /** Ends the running recipes with this tag (a loop, a ramp, marks that must not outlive their UI). */
  stop: (tag: string) => void;
  /** Subscribes to stop requests (the director); returns the unsubscribe. */
  listenStop: (listener: (tag: string) => void) => () => void;
}

/** Events kept while nothing listens yet (the lazy host is still loading). */
const MAX_PENDING = 16;
/** A held event older than this when the first listener arrives is dropped (stale juice). */
const PENDING_MAX_AGE_MS = 1000;

interface PendingEvent {
  name: string;
  payload: JuicePayload;
  time: number;
}

/**
 * The typed event bus gameplay talks to (juice-core D1): `emit("card.played", { variant })`
 * instead of calling effects. Synchronous fan-out; a failing listener never breaks gameplay.
 * Events emitted before anything listens (the director's chunk still loading on a slow network)
 * wait briefly and reach the first listener if they are less than a second old.
 */
export function createJuiceBus<E extends JuiceEventMap>(
  now: () => number = () => Date.now()
): JuiceBus<E> {
  const listeners = new Set<JuiceListener>();
  const stopListeners = new Set<(tag: string) => void>();
  let pending: PendingEvent[] = [];

  const deliver = (name: string, data: JuicePayload): void => {
    listeners.forEach((listener) => {
      try {
        listener(name, data);
      } catch (error: unknown) {
        // Juice is never load-bearing: report in dev and keep playing.
        if (import.meta.env.DEV) console.warn(`[juice] listener failed for ${name}`, error);
      }
    });
  };

  const emit = <K extends keyof E & string>(name: K, ...args: JuiceEmitArgs<E[K]>): void => {
    const data: JuicePayload = args[0] ?? {};
    if (listeners.size > 0) deliver(name, data);
    else pending = [...pending, { name, payload: data, time: now() }].slice(-MAX_PENDING);
  };

  const listen = (listener: JuiceListener): (() => void) => {
    listeners.add(listener);
    const held = pending.filter((event) => now() - event.time <= PENDING_MAX_AGE_MS);
    pending = [];
    held.forEach((event) => deliver(event.name, event.payload));
    return () => {
      listeners.delete(listener);
    };
  };

  const stop = (tag: string): void => {
    stopListeners.forEach((listener) => listener(tag));
  };

  const listenStop = (listener: (tag: string) => void): (() => void) => {
    stopListeners.add(listener);
    return () => {
      stopListeners.delete(listener);
    };
  };

  return { emit, listen, stop, listenStop };
}
