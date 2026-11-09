import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle } from "lucide-react";
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
      className={cn(
        "relative flex min-w-0 touch-none",
        isDragging && "z-50 opacity-90",
        card.droughtWarning &&
          "rounded-game-card ring-4 ring-destructive ring-offset-2 ring-offset-background"
      )}
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
      {card.droughtWarning && (
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex aspect-game-card-image animate-card-draw items-end p-1",
            DRAW_DELAY[index]
          )}
        >
          <AlertTriangle
            aria-hidden="true"
            className="size-6 rounded-full bg-destructive p-1 text-destructive-foreground"
          />
        </span>
      )}
    </li>
  );
};

/** The Journalistieke Droogte line (game-board D6): text next to the destructive ring and icon. */
export const DroughtNotice = ({ className }: { className?: string }) => (
  <p
    className={cn(
      "flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive",
      className
    )}
  >
    <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
    <span>
      <span className="font-bold">{UI_COPY.board.modifiers.journalismDrought.label}:</span>{" "}
      {UI_COPY.board.modifiers.journalismDrought.description}
    </span>
  </p>
);

export interface CardDraftProps {
  cards: DraftCardView[];
  onShowDetails: (card: DraftCardView) => void;
}

/** The 3-card draft. Arrow keys move between cards; Enter / Space opens the focused card's details. */
export const CardDraft = ({ cards, onShowDetails }: CardDraftProps) => {
  const { onKeyDown } = useRovingFocus(CARD_SELECTOR);
  const drought = cards.some((card) => card.droughtWarning);
  return (
    <section
      aria-labelledby="draft-heading"
      className="mx-auto flex w-full shrink-0 flex-col gap-2 sm:max-w-xl board-split:max-w-none"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h2 id="draft-heading" className="text-sm font-bold">
          Kies een post voor de feed
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {UI_COPY.board.dragHint} of gebruik de pijltjes en Enter
        </p>
      </div>
      {/* On desk the board shows the notice in its status panel instead (desktop-layout D2). */}
      {drought && <DroughtNotice className="board-desk:hidden" />}
      <ul className="mx-auto grid w-full grid-cols-3 gap-2 sm:gap-4" onKeyDown={onKeyDown}>
        {cards.map((card, index) => (
          <DraftSlot key={card.id} card={card} index={index} onShowDetails={onShowDetails} />
        ))}
      </ul>
    </section>
  );
};
