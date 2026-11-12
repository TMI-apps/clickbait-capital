import { useEffect, useState } from "react";
import type { JuiceListener } from "@/features/juice-engine/api";

/** One logged event. */
export interface JuiceLogEntry {
  id: number;
  name: string;
  variant?: string;
  /** Milliseconds since the page loaded. */
  time: number;
}

const MAX_ENTRIES = 20;

/** The last 20 events on a juice bus, newest first (the inspector's log). */
export function useJuiceEventLog(listen: (listener: JuiceListener) => () => void): JuiceLogEntry[] {
  const [entries, setEntries] = useState<JuiceLogEntry[]>([]);
  useEffect(() => {
    let id = 0;
    return listen((name, payload) => {
      id += 1;
      const entry = { id, name, variant: payload.variant, time: Math.round(performance.now()) };
      setEntries((current) => [entry, ...current].slice(0, MAX_ENTRIES));
    });
  }, [listen]);
  return entries;
}
