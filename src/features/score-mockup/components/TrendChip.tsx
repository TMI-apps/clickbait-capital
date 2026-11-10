import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface TrendChipProps {
  text: string;
  positive: boolean;
  /** Preview style: outlined, for "what happens if I play this". */
  preview?: boolean;
  className?: string;
}

/** Signed trend ("+8,2%/beurt") with arrow; colour plus arrow so colour is not the only signal. */
export const TrendChip = ({ text, positive, preview = false, className }: TrendChipProps) => {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-xs font-bold whitespace-nowrap tabular-nums",
        positive ? "text-success" : "text-destructive",
        preview
          ? "border border-dashed border-current"
          : positive
            ? "bg-success/15"
            : "bg-destructive/15",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {text}
    </span>
  );
};
