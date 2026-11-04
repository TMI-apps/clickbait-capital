import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import { Coins, Newspaper, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventOptionKind } from "@/features/game-engine/api";
import { Button } from "@/components/common/Button";
import { GameCardEffects } from "@/components/common/GameCard";
import { Modal } from "@/components/common/Modal";
import { UI_COPY } from "@/features/game-content/api";
import type { EventView } from "@/features/game-board/types/gameBoard.types";

const OPTION_ICON: Record<EventOptionKind, LucideIcon> = {
  commercial: Coins,
  engagement: Zap,
  journalism: Newspaper,
};

export interface EventDialogProps {
  event: EventView | null;
  onChoose: (optionId: string) => void;
}

/** Pending event: must be answered with one of three policy options (no close). */
export const EventDialog = ({ event: current, onChoose }: EventDialogProps) => {
  const event = useRetainedValue(current);
  return (
    <Modal
      open={current !== null}
      dismissible={false}
      title={event ? `${UI_COPY.events.kicker}: ${event.title}` : undefined}
      description={event?.body}
    >
      {event && (
        <ul className="flex flex-col gap-2">
          {event.options.map((option) => {
            const KindIcon = OPTION_ICON[option.kind];
            return (
              <li key={option.id}>
                <Button
                  variant="outline"
                  className="h-auto min-h-11 w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                  onClick={() => onChoose(option.id)}
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <KindIcon aria-hidden="true" className="size-3.5" />
                    {UI_COPY.events.optionKinds[option.kind]}
                  </span>
                  <span className="text-sm">{option.label}</span>
                  {option.effects.length > 0 && (
                    <span className="w-full">
                      <GameCardEffects effects={option.effects} />
                    </span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
