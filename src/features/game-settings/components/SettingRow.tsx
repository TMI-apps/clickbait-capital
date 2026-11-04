import { useId } from "react";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/common/SegmentedControl";

export interface SettingRowProps<TValue extends string> {
  label: string;
  hint?: string;
  options: SegmentedControlOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
}

/** One labelled setting: heading, optional hint, and a 44 px segmented choice. */
export const SettingRow = <TValue extends string>({
  label,
  hint,
  options,
  value,
  onValueChange,
}: SettingRowProps<TValue>) => {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-semibold">
        {label}
      </span>
      <SegmentedControl
        size="lg"
        labelledBy={labelId}
        options={options}
        value={value}
        onValueChange={onValueChange}
      />
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
};
