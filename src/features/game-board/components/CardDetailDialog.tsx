import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import { Button } from "@/components/common/Button";
import { GameCard } from "@/components/common/GameCard";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { Modal } from "@/components/common/Modal";
import { getCardImage } from "@/features/card-imagery/api";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

export interface CardDetailDialogProps {
  card: DraftCardView | null;
  onClose: () => void;
  onPlay: (cardId: string) => void;
  /** Where focus goes when the dialog closes (the trigger card may have left the draft). */
  onCloseAutoFocus?: (event: Event) => void;
}

/** Full card view (large card, whole text) with a play action; opened by tapping a draft card. */
export const CardDetailDialog = ({
  card: current,
  onClose,
  onPlay,
  onCloseAutoFocus,
}: CardDetailDialogProps) => {
  const card = useRetainedValue(current);
  return (
    <Modal
      closeLabel={UI_COPY.settings.closeButton}
      open={current !== null}
      onClose={onClose}
      onCloseAutoFocus={onCloseAutoFocus}
      title={card?.title}
      description={card && <GlossaryText text={card.body} glossary={GLOSSARY} />}
      actions={
        card && (
          <>
            <Button variant="outline" className="min-h-11" onClick={onClose}>
              {UI_COPY.board.cancelPlay}
            </Button>
            <Button className="min-h-11" onClick={() => onPlay(card.id)}>
              {UI_COPY.board.confirmPlay}
            </Button>
          </>
        )
      }
    >
      {card && (
        <div className="mx-auto w-full max-w-56">
          <GameCard
            type={card.type}
            title={card.title}
            effects={card.effects}
            flavor={card.flavor && <GlossaryText text={card.flavor} glossary={GLOSSARY} />}
            image={getCardImage(card.id) ?? undefined}
          />
        </div>
      )}
    </Modal>
  );
};
