import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GameCard } from "@/components/common/GameCard";
import { getCardImage } from "@/features/card-imagery/api";
import { useRovingFocus } from "@/features/game-board/hooks/useRovingFocus";
import { UI_COPY } from "@/features/game-content/api";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";
import { cn } from "@/shared/utils/cn";

const CARD_SELECTOR = '[data-slot="game-card"]';

/** Stagger of the three cards' draw, in steps of the fast motion token (0 under reduced motion). */
const DRAW_DELAY = [
  "[animation-delay:0ms]",
  "[animation-delay:var(--duration-fast)]",
  "[animation-delay:calc(var(--duration-fast)*2)]",
];

/** The slot element of a draft card, e.g. to start play particles where the card was. */
export const draftCardElement = (cardId: string): Element | null =>
  document.querySelector(`[data-draft-card="${globalThis.CSS.escape(cardId)}"]`);

interface DraftSlotProps {
  card: DraftCardView;
  index: number;
  onShowDetails: (card: DraftCardView) => void;
}

/** One draft card: tap / Enter opens its details (with a Play button), drag drops it on the feed. */
const DraftSlot = ({ card, index, onShowDetails }: DraftSlotProps) => {
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({ id: card.id });
  return (
    <li
      ref={setNodeRef}
      data-draft-card={card.id}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("relative flex min-w-0 touch-none", isDragging && "z-50 opacity-90")}
    >
      <GameCard
        type={card.type}
        title={card.title}
        effects={card.effects}
        image={getCardImage(card.id) ?? undefined}
        onSelect={() => onShowDetails(card)}
        animation="draw"
        size="compact"
        className={cn("h-full", DRAW_DELAY[index])}
      />
    </li>
  );
};

export interface CardDraftProps {
  cards: DraftCardView[];
  onShowDetails: (card: DraftCardView) => void;
}

/** The 3-card draft. Arrow keys move between cards; Enter / Space opens the focused card's details. */
export const CardDraft = ({ cards, onShowDetails }: CardDraftProps) => {
  const { onKeyDown } = useRovingFocus(CARD_SELECTOR);
  return (
    <section
      aria-labelledby="draft-heading"
      className="mx-auto flex w-full shrink-0 flex-col gap-2 sm:max-w-xl board-split:max-w-none board-desk:max-w-md"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h2 id="draft-heading" className="text-sm font-bold">
          Kies een post voor de feed
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {UI_COPY.board.dragHint} of gebruik de pijltjes en Enter
        </p>
      </div>
      <ul className="mx-auto grid w-full grid-cols-3 gap-2 sm:gap-4" onKeyDown={onKeyDown}>
        {cards.map((card, index) => (
          <DraftSlot key={card.id} card={card} index={index} onShowDetails={onShowDetails} />
        ))}
      </ul>
    </section>
  );
};
