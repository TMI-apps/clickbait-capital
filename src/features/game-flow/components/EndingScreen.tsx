import { ServerOff, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/common/Button";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
import type { EndingView } from "@/features/game-flow/types/gameFlow.types";
import { cn } from "@/shared/utils/cn";
import { FlowScreen } from "./FlowScreen";

/** One icon per ending, so the screen never relies on colour alone. */
const ENDING_ICON: Record<NonNullable<EndingView["reason"]> | "won", LucideIcon> = {
  bankrupt: ServerOff,
  won: TrendingUp,
};

export interface EndingScreenProps {
  ending: EndingView;
  onContinue: () => void;
}

/** The dramatic ending: newspaper headline for a game over, the bell for the IPO. */
export const EndingScreen = ({ ending, onContinue }: EndingScreenProps) => {
  const lost = ending.outcome === "lost";
  const Icon = ENDING_ICON[ending.reason ?? "won"];
  return (
    <FlowScreen
      tone="dramatic"
      kicker={ending.kicker}
      title={ending.title}
      icon={
        <span
          className={cn(
            "relative inline-flex size-16 items-center justify-center rounded-full",
            lost ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
          )}
        >
          <Icon aria-hidden="true" className="size-8" />
        </span>
      }
      actions={
        <Button className="min-h-11" onClick={onContinue}>
          {UI_COPY.results.reportButton}
        </Button>
      }
    >
      <p
        className={cn(
          "border-y py-3 font-heading text-xl leading-snug font-bold",
          lost ? "border-destructive" : "border-primary"
        )}
      >
        {ending.headline}
      </p>
      {ending.body && (
        <p className="text-base">
          <GlossaryText text={ending.body} glossary={GLOSSARY} />
        </p>
      )}
      {ending.lesson && (
        <p className="text-base font-semibold">
          <GlossaryText text={ending.lesson} glossary={GLOSSARY} />
        </p>
      )}
    </FlowScreen>
  );
};
