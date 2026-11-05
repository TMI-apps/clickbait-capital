import { cn } from "@/shared/utils/cn";

export interface CapBadgeProps {
  /** Spoken text instead of the visual "MAX"; without it the badge is hidden from screen readers. */
  srText?: string;
  /** Layout only (margin, position). */
  className?: string;
}

/**
 * Greyed "MAX" badge: a meter is at its cap, or part of a gain is wasted there. Used on card
 * effect rows and on full meters, so the cap reads the same everywhere.
 */
export const CapBadge = ({ srText, className }: CapBadgeProps) => (
  <span
    className={cn(
      "shrink-0 rounded-sm bg-muted px-1 font-sans text-[0.625rem] leading-4 font-bold tracking-wide text-muted-foreground",
      className
    )}
  >
    <span aria-hidden="true">MAX</span>
    {srText && <span className="sr-only">{srText}</span>}
  </span>
);
