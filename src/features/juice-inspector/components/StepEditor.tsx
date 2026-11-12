import { useId } from "react";
import { Input } from "@/components/common/Input";
import type {
  JuiceEffectRegistry,
  JuiceParamSpec,
  JuiceStepData,
} from "@/features/juice-engine/api";

/** One list of steps: the shared `steps` or a variant. */
export interface StepBranch {
  branch: string;
  steps: JuiceStepData[];
}

export interface StepEditorProps {
  title: string;
  branches: StepBranch[];
  effects: JuiceEffectRegistry;
  onChange: (
    target: { branch: string; index: number },
    param: string,
    value: number | string
  ) => void;
}

const START_SPEC: JuiceParamSpec = { unit: "ms", min: 0, max: 3000, step: 10, label: "Start" };
const BASE_KEYS = new Set(["effect", "at", "chance"]);

interface NumberFieldProps {
  spec: JuiceParamSpec;
  value: number | undefined;
  onChange: (value: number) => void;
}

/** A slider with a number box beside it; both edit the same value. */
const NumberField = ({ spec, value, onChange }: NumberFieldProps) => {
  const labelId = useId();
  const read = (raw: string): void => {
    const next = Number(raw);
    if (raw !== "" && Number.isFinite(next)) onChange(next);
  };
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)_5.5rem] items-center gap-2">
      <span id={labelId} className="text-sm">
        {spec.label}
        {spec.unit && <span className="text-muted-foreground"> ({spec.unit})</span>}
      </span>
      <input
        type="range"
        aria-label={`${spec.label} schuif`}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value ?? spec.default ?? spec.min}
        onChange={(event) => read(event.target.value)}
        className="min-h-11 w-full"
      />
      <Input
        type="number"
        aria-labelledby={labelId}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value ?? ""}
        placeholder={spec.default === undefined ? undefined : String(spec.default)}
        onChange={(event) => read(event.target.value)}
        className="min-h-11"
      />
    </div>
  );
};

/** A free text param (target, glyphs, colour token, sound id, pattern). */
const TextField = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-2 text-sm">
    <span>{name}</span>
    <Input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11" />
  </label>
);

interface StepFieldsProps {
  step: JuiceStepData;
  index: number;
  specs: Record<string, JuiceParamSpec>;
  onChange: (param: string, value: number | string) => void;
}

const StepFields = ({ step, index, specs, onChange }: StepFieldsProps) => {
  const texts = Object.entries(step).filter(
    ([key, value]) => !BASE_KEYS.has(key) && !specs[key] && typeof value === "string"
  );
  const numberOf = (key: string): number | undefined =>
    typeof step[key] === "number" ? (step[key] as number) : undefined;
  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border p-3">
      <legend className="px-1 font-mono text-sm font-semibold">{`Stap ${index + 1}: ${step.effect}`}</legend>
      <NumberField
        spec={START_SPEC}
        value={step.at ?? 0}
        onChange={(value) => onChange("at", value)}
      />
      {Object.entries(specs).map(([key, spec]) => (
        <NumberField
          key={key}
          spec={spec}
          value={numberOf(key)}
          onChange={(value) => onChange(key, value)}
        />
      ))}
      {texts.map(([key, value]) => (
        <TextField
          key={key}
          name={key}
          value={String(value)}
          onChange={(next) => onChange(key, next)}
        />
      ))}
    </fieldset>
  );
};

/**
 * Every step of the selected event, with a control per tunable value: numbers from the effect's
 * param ranges (slider + box), texts as text. Each edit is an override in the tuning store, so the
 * next play uses it and it persists.
 */
export const StepEditor = ({ title, branches, effects, onChange }: StepEditorProps) => (
  <section aria-labelledby="juice-steps" className="flex flex-col gap-3">
    <h2 id="juice-steps" className="text-base font-semibold">
      Stappen: <span className="font-mono">{title}</span>
    </h2>
    {branches.map(({ branch, steps }) => (
      <div key={branch} className="flex flex-col gap-2">
        {branches.length > 1 && (
          <h3 className="font-mono text-xs text-muted-foreground">{branch}</h3>
        )}
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">Geen stappen (bewust stil).</p>
        )}
        {steps.map((step, index) => (
          <StepFields
            key={`${branch}-${index}`}
            step={step}
            index={index}
            specs={effects[step.effect]?.params ?? {}}
            onChange={(param, value) => onChange({ branch, index }, param, value)}
          />
        ))}
      </div>
    ))}
  </section>
);
