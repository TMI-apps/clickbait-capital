import { ExternalLink } from "lucide-react";
import { useRetainedValue } from "@/shared/hooks/useRetainedValue";
import { Button } from "@/components/common/Button";
import { GameCard } from "@/components/common/GameCard";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { Modal } from "@/components/common/Modal";
import { getCardImage } from "@/features/card-imagery/api";
import { fillTemplate, GLOSSARY, UI_COPY } from "@/features/game-content/api";
import type { DraftCardView, RealCaseView } from "@/features/game-board/types/gameBoard.types";

export interface CardDetailDialogProps {
  card: DraftCardView | null;
  onClose: () => void;
  onPlay: (cardId: string) => void;
  /** Where focus goes when the dialog closes (the trigger card may have left the draft). */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * "Echt gebeurd" under a decision card (policy-cards § 5b, D3): one plain line and a small link
 * to the article, opened in a new tab without passing on this page.
 */
const RealCaseLine = ({ realCase }: { realCase: RealCaseView }) => (
  <p className="text-xs leading-snug text-muted-foreground">
    <span className="font-semibold text-foreground">{UI_COPY.board.realCaseLabel}</span>{" "}
    {realCase.line}{" "}
    <a
      href={realCase.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={fillTemplate(UI_COPY.board.realCaseLinkLabel, {
        publisher: realCase.publisher,
        date: realCase.date,
      })}
      className="inline-flex items-center gap-0.5 font-medium whitespace-nowrap underline underline-offset-2 hover:text-primary"
    >
      {UI_COPY.board.realCaseLink}
      <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
    </a>
  </p>
);

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
            {/* The play has its own juice (`card.played`), not the press tap. */}
            <Button className="min-h-11" data-juice-press="off" onClick={() => onPlay(card.id)}>
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
      {card?.realCase && <RealCaseLine realCase={card.realCase} />}
    </Modal>
  );
};
