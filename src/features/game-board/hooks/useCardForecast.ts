import { useState } from "react";
import type { DragStartEvent } from "@dnd-kit/core";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

/** Why a card is previewed on the chart: held down, or keyboard-focused (score-redesign D12). */
export type CardPreviewSource = "hold" | "focus";

export interface CardForecast {
  /** Where each line lands if the previewed card is played, or null when no card is previewed. */
  forecast: DraftCardView["forecast"] | null;
  /** A card is held or keyboard-focused (id) or no longer (null). */
  onPreview: (source: CardPreviewSource, cardId: string | null) => void;
  /** A card is being dragged (the feed shows its drop target). */
  dragging: boolean;
  /** DndContext handlers: the dragged card is previewed until the drag ends. */
  dragEvents: { onDragStart: (event: DragStartEvent) => void; onDragCancel: () => void };
  /** Call from the DndContext's `onDragEnd`. */
  endDrag: () => void;
}

/**
 * The chart's forecast (score-redesign D12): the card being dragged wins, then the one held down,
 * then the one open in its detail dialog, then the keyboard-focused one. A played card leaves the
 * draft, so its forecast goes with it.
 */
export function useCardForecast(
  draft: DraftCardView[],
  detailCard: DraftCardView | null
): CardForecast {
  const [dragged, setDragged] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<Record<CardPreviewSource, string | null>>({
    hold: null,
    focus: null,
  });
  const previewId = dragged ?? previewed.hold ?? detailCard?.id ?? previewed.focus;
  return {
    forecast: draft.find((card) => card.id === previewId)?.forecast ?? null,
    onPreview: (source, cardId) => setPreviewed((current) => ({ ...current, [source]: cardId })),
    dragging: dragged !== null,
    dragEvents: {
      onDragStart: ({ active }) => setDragged(String(active.id)),
      onDragCancel: () => setDragged(null),
    },
    endDrag: () => setDragged(null),
  };
}
