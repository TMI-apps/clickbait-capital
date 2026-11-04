import { Coins, Newspaper, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventOptionKind } from "@/features/game-engine/api";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { EventView } from "@/features/game-board/types/gameBoard.types";

const OPTION_KIND: Record<EventOptionKind, { label: string; icon: LucideIcon }> = {
  commercial: { label: "Commercieel", icon: Coins },
  engagement: { label: "Engagement", icon: Zap },
  journalism: { label: "Journalistiek", icon: Newspaper },
};

export interface EventDialogProps {
  event: EventView | null;
  onChoose: (optionId: string) => void;
}

/** Pending event: must be answered with one of three policy options (no close). */
export const EventDialog = ({ event, onChoose }: EventDialogProps) => (
  <Modal
    open={event !== null}
    dismissible={false}
    title={event ? `Gebeurtenis: ${event.title}` : undefined}
    description={event?.body}
  >
    {event && (
      <ul className="flex flex-col gap-2">
        {event.options.map((option) => {
          const kind = OPTION_KIND[option.kind];
          return (
            <li key={option.id}>
              <Button
                variant="outline"
                className="h-auto min-h-11 w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                onClick={() => onChoose(option.id)}
              >
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <kind.icon aria-hidden="true" className="size-3.5" />
                  {kind.label}
                </span>
                <span className="text-sm">{option.label}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    )}
  </Modal>
);
