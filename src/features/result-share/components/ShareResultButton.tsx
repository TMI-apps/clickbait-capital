import { useEffect, useRef } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useResultShare } from "@/features/result-share/hooks/useResultShare";
import type {
  ShareCardContent,
  ShareOutcome,
  ShareResultCopy,
} from "@/features/result-share/types/resultShare.types";

export interface ShareResultButtonProps {
  content: ShareCardContent;
  copy: ShareResultCopy;
  className?: string;
  /** Each finished share attempt, with the button (e.g. for feedback that starts on it). */
  onOutcome?: (outcome: ShareOutcome, button: HTMLButtonElement | null) => void;
}

/**
 * "Deel je resultaat": shares the run's card image and link, with a polite status line that
 * says what happened (shared, saved and copied, failed). Closing the share sheet says nothing.
 */
export const ShareResultButton = ({
  content,
  copy,
  className,
  onOutcome,
}: ShareResultButtonProps) => {
  const { share, outcome, busy } = useResultShare(content);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onOutcomeRef = useRef(onOutcome);
  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);
  useEffect(() => {
    if (outcome) onOutcomeRef.current?.(outcome, buttonRef.current);
  }, [outcome]);
  return (
    <div className={className}>
      <Button
        ref={buttonRef}
        variant="secondary"
        className="min-h-11 w-full"
        // aria-disabled, not disabled: a disabled button drops keyboard focus to <body>.
        aria-disabled={busy}
        onClick={() => void share()}
      >
        <Share2 aria-hidden="true" />
        {copy.buttonLabel}
      </Button>
      <p role="status" className="mt-1 min-h-5 text-center text-sm text-muted-foreground">
        {outcome ? copy.statuses[outcome] : ""}
      </p>
    </div>
  );
};
