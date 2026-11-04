import { Coins, Newspaper, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/common/Button";
import { GameCardEffects } from "@/components/common/GameCard";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";
import type { FlowEvent } from "@/features/game-flow/types/gameFlow.types";

type OptionKind = FlowEvent["options"][number]["kind"];

const OPTION_ICON: Record<OptionKind, LucideIcon> = {
  commercial: Coins,
  engagement: Zap,
  journalism: Newspaper,
};

/** Option letters as the design names them (A commercial, B engagement, C journalism). */
const OPTION_LETTER: Record<OptionKind, string> = {
  commercial: "A",
  engagement: "B",
  journalism: "C",
};

export interface EventModalProps {
  open: boolean;
  /** The event to show; kept by the caller while the modal animates closed. */
  event: FlowEvent | null;
  onChoose: (optionId: string) => void;
}

/**
 * An event interrupts the draft: one urgent situation and three policy options with their
 * phase-scaled effects. It must be answered (no close button, Escape and overlay ignored).
 */
export const EventModal = ({ open, event, onChoose }: EventModalProps) => (
  <Modal
    open={open}
    dismissible={false}
    title={event ? `${UI_COPY.events.kicker}: ${event.title}` : undefined}
    description={event?.body}
  >
    {event && (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Siren aria-hidden="true" className="size-4 text-destructive" />
          {UI_COPY.events.prompt}
        </legend>
        {event.options.map((option) => {
          const KindIcon = OPTION_ICON[option.kind];
          return (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto min-h-11 w-full flex-col items-start gap-1 py-2 text-left whitespace-normal"
              onClick={() => onChoose(option.id)}
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <KindIcon aria-hidden="true" className="size-3.5" />
                {OPTION_LETTER[option.kind]} · {UI_COPY.events.optionKinds[option.kind]}
              </span>
              <span className="text-sm">{option.label}</span>
              {option.effects.length > 0 && (
                <span className="w-full">
                  <GameCardEffects effects={option.effects} />
                </span>
              )}
            </Button>
          );
        })}
      </fieldset>
    )}
  </Modal>
);
