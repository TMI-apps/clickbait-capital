import type { JuiceLogEntry } from "@/features/juice-inspector/hooks/useJuiceEventLog";

/**
 * The last events on the game's bus, newest first. Not a live region: screen readers stay on the
 * controls (juice is never announced).
 */
export const EventLog = ({ entries }: { entries: JuiceLogEntry[] }) => (
  <section aria-labelledby="juice-log" className="flex flex-col gap-2">
    <h2 id="juice-log" className="text-base font-semibold">
      Log
    </h2>
    {entries.length === 0 ? (
      <p className="text-sm text-muted-foreground">Nog geen events.</p>
    ) : (
      <ol className="flex flex-col gap-1 font-mono text-xs">
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-2">
            <span className="text-muted-foreground tabular-nums">{entry.time} ms</span>
            <span>
              {entry.name}
              {entry.variant ? ` · ${entry.variant}` : ""}
            </span>
          </li>
        ))}
      </ol>
    )}
  </section>
);
