import { Coins, Newspaper, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/common/Button";
import { GameCardEffects } from "@/components/common/GameCard";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { Modal } from "@/components/common/Modal";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
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
  /** Where focus goes once the modal has closed; the board returns it to the draft. */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * An event interrupts the draft: one urgent situation and three policy options with their
 * phase-scaled effects. It must be answered (no close button, Escape and overlay ignored).
 */
export const EventModal = ({ open, event, onChoose, onCloseAutoFocus }: EventModalProps) => (
  <Modal
    onCloseAutoFocus={onCloseAutoFocus}
    open={open}
    dismissible={false}
    title={event ? `${UI_COPY.events.kicker}: ${event.title}` : undefined}
    description={event && <GlossaryText text={event.body} glossary={GLOSSARY} />}
  >
    {event && (
      // Keyed by event: events reuse option ids, so the next event gets fresh buttons (no focus
      // or press state carried over) and its first option takes focus (readable-hover D3).
      <fieldset key={event.id} className="flex flex-col gap-2">
        <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Siren aria-hidden="true" className="size-4 text-destructive" />
          {UI_COPY.events.prompt}
        </legend>
        {event.options.map((option, index) => {
          const KindIcon = OPTION_ICON[option.kind];
          return (
            <Button
              key={option.id}
              variant="choice"
              // Moves focus inside the open dialog when the next event replaces the options.
              autoFocus={index === 0}
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
