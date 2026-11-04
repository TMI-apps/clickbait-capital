import { Button } from "@/components/common/Button";
import { GameCard } from "@/components/common/GameCard";
import { Modal } from "@/components/common/Modal";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

export interface CardDetailDialogProps {
  card: DraftCardView | null;
  onClose: () => void;
  onPlay: (cardId: string) => void;
}

/** Full card view (large card, whole text) with a play action. */
export const CardDetailDialog = ({ card, onClose, onPlay }: CardDetailDialogProps) => (
  <Modal
    open={card !== null}
    onClose={onClose}
    title={card?.title}
    description={card?.body}
    actions={
      card && (
        <>
          <Button variant="outline" className="min-h-11" onClick={onClose}>
            Terug
          </Button>
          <Button className="min-h-11" onClick={() => onPlay(card.id)}>
            Plaats in feed
          </Button>
        </>
      )
    }
  >
    {card && (
      <div className="mx-auto w-full max-w-56">
        <GameCard type={card.type} title={card.title} effects={card.effects} flavor={card.body} />
      </div>
    )}
  </Modal>
);
