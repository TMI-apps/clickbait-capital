import { useState } from "react";
import { Button } from "@/components/common/Button";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Textarea } from "@/components/common/Textarea";
import { useMotionPreference, type MotionPreference } from "@/features/game-settings/api";
import {
  JUICE_TUNING_RANGES,
  type JuiceTuning,
  type JuiceTuningStore,
} from "@/features/juice-engine/api";

export interface TuningPanelProps {
  tuning: JuiceTuning;
  store: JuiceTuningStore;
}

type NumericKnob = keyof typeof JUICE_TUNING_RANGES;

const KNOBS: Array<{ key: NumericKnob; label: string }> = [
  { key: "intensity", label: "Intensiteit" },
  { key: "motionScale", label: "Tempo (× duur)" },
  { key: "volume", label: "Volume" },
];

const MOTION_OPTIONS: Array<{ value: MotionPreference; label: string }> = [
  { value: "system", label: "Systeem" },
  { value: "reduced", label: "Verminderd" },
  { value: "full", label: "Volledig" },
];

const ON_OFF = [
  { value: "on" as const, label: "Aan" },
  { value: "off" as const, label: "Uit" },
];

/**
 * Global knobs (intensity, tempo, volume, haptics), the real Beweging setting (to preview reduced
 * motion), and the export: "Kopieer JSON" copies every override for an agent to fold into the
 * recipes; when the clipboard is blocked the JSON shows in a box to copy by hand.
 */
export const TuningPanel = ({ tuning, store }: TuningPanelProps) => {
  const { preference, setPreference } = useMotionPreference();
  const [exported, setExported] = useState<string | null>(null);

  const copy = async (): Promise<void> => {
    const json = store.exportOverrides();
    try {
      await navigator.clipboard.writeText(json);
      setExported(null);
    } catch {
      setExported(json);
    }
  };

  return (
    <section aria-labelledby="juice-tuning" className="flex flex-col gap-3">
      <h2 id="juice-tuning" className="text-base font-semibold">
        Afstelling
      </h2>
      {KNOBS.map(({ key, label }) => {
        const range = JUICE_TUNING_RANGES[key];
        return (
          <label
            key={key}
            className="grid grid-cols-[8rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm"
          >
            <span>{label}</span>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={tuning[key]}
              onChange={(event) => store.setGlobal(key, Number(event.target.value))}
              className="min-h-11 w-full"
            />
            <span className="text-right font-mono tabular-nums">{tuning[key].toFixed(2)}</span>
          </label>
        );
      })}
      <div className="flex flex-col gap-1 text-sm">
        <span id="juice-haptics">Trillen</span>
        <SegmentedControl
          labelledBy="juice-haptics"
          options={ON_OFF}
          value={tuning.haptics ? "on" : "off"}
          onValueChange={(value) => store.setGlobal("haptics", value === "on")}
        />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span id="juice-motion">Beweging (de echte instelling)</span>
        <SegmentedControl
          labelledBy="juice-motion"
          options={MOTION_OPTIONS}
          value={preference}
          onValueChange={setPreference}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="min-h-11" onClick={() => void copy()}>
          Kopieer JSON
        </Button>
        <Button variant="outline" size="sm" className="min-h-11" onClick={store.reset}>
          Reset
        </Button>
      </div>
      {exported !== null && (
        <Textarea readOnly value={exported} aria-label="Overrides als JSON" rows={6} />
      )}
    </section>
  );
};
