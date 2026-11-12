import { Button } from "@/components/common/Button";
import type { InspectorEntry } from "@/features/juice-inspector/types/juiceInspector.types";

export interface EventPadProps {
  entries: InspectorEntry[];
  /** The entry whose steps the editor shows. */
  selected: InspectorEntry | null;
  onTrigger: (entry: InspectorEntry) => void;
}

/** One 44 px trigger button per event and variant, grouped by domain ("card", "meter", …). */
export const EventPad = ({ entries, selected, onTrigger }: EventPadProps) => {
  const domains = [...new Set(entries.map((entry) => entry.domain))];
  return (
    <section aria-labelledby="juice-events" className="flex flex-col gap-3">
      <h2 id="juice-events" className="text-base font-semibold">
        Events
      </h2>
      {domains.map((domain) => (
        <div key={domain} className="flex flex-col gap-1.5">
          <h3 className="font-mono text-xs text-muted-foreground">{domain}</h3>
          <div className="flex flex-wrap gap-2">
            {entries
              .filter((entry) => entry.domain === domain)
              .map((entry) => (
                <Button
                  key={entry.label}
                  variant={selected?.label === entry.label ? "secondary" : "outline"}
                  size="sm"
                  className="min-h-11"
                  aria-pressed={selected?.label === entry.label}
                  onClick={() => onTrigger(entry)}
                >
                  <span className="font-mono text-xs">{entry.label}</span>
                </Button>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
};
