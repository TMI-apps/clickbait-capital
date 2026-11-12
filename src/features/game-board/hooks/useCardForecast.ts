import { useEffect, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { emitJuice } from "@/features/game-juice/api";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

/** Why a card is previewed on the chart: held down, or keyboard-focused (score-redesign D12). */
export type CardPreviewSource = "hold" | "focus";

export interface UseCardForecastOptions {
  draft: DraftCardView[];
  /** The card open in its detail dialog, or null. */
  detailCard: DraftCardView | null;
  /** The element of a draft card: where its pickup juice starts. */
  cardElement: (cardId: string) => Element | null;
  /** Drop target id of the feed: a drag over it plays `card.over-feed`. */
  feedId: string;
}

export interface CardForecast {
  /** Where each line lands if the previewed card is played, or null when no card is previewed. */
  forecast: DraftCardView["forecast"] | null;
  /** The previewed play's change per line as text, or null. */
  forecastText: DraftCardView["forecastText"] | null;
  /** A card is held or keyboard-focused (id) or no longer (null). */
  onPreview: (source: CardPreviewSource, cardId: string | null) => void;
  /** A card is being dragged (the feed shows its drop target). */
  dragging: boolean;
  /** DndContext handlers: the dragged card is previewed until the drag ends. */
  dragEvents: {
    onDragStart: (event: DragStartEvent) => void;
    onDragOver: (event: DragOverEvent) => void;
    onDragCancel: () => void;
  };
  /** Call from the DndContext's `onDragEnd`; true when the card lands on the feed (a play). */
  endDrag: (event: DragEndEvent) => boolean;
}

/** The draft card of the first id set, in priority order. */
function firstPreviewed(
  draft: DraftCardView[],
  ids: Array<string | null | undefined>
): DraftCardView | undefined {
  const previewId = ids.find((id) => typeof id === "string");
  return draft.find((card) => card.id === previewId);
}

interface DragJuiceOptions extends Pick<
  UseCardForecastOptions,
  "draft" | "cardElement" | "feedId"
> {
  /** The card held down right now: its drag lifts it a second time otherwise. */
  held: string | null;
  setDragged: (cardId: string | null) => void;
}

/** The drag's handlers with their juice: lift, over the feed, let go elsewhere (lap-3 D4). */
function dragJuice({ draft, cardElement, feedId, held, setDragged }: DragJuiceOptions) {
  const pickUp = (cardId: string): void => {
    const card = draft.find((candidate) => candidate.id === cardId);
    if (card) emitJuice("card.pickup", { variant: card.type, origin: cardElement(cardId) });
  };
  const cancel = (): void => {
    setDragged(null);
    emitJuice("card.cancel");
  };
  const dragEvents: CardForecast["dragEvents"] = {
    onDragStart: ({ active }) => {
      const cardId = String(active.id);
      if (held !== cardId) pickUp(cardId);
      setDragged(cardId);
    },
    onDragOver: ({ over }) => {
      if (over?.id === feedId) emitJuice("card.over-feed");
    },
    onDragCancel: cancel,
  };
  const endDrag: CardForecast["endDrag"] = ({ over }) => {
    if (over?.id !== feedId) {
      cancel();
      return false;
    }
    setDragged(null);
    return true;
  };
  return { pickUp, dragEvents, endDrag };
}

/**
 * The chart's forecast (score-redesign D12): the card being dragged wins, then the one held down,
 * then the one open in its detail dialog, then the keyboard-focused one. A played card leaves the
 * draft, so its forecast goes with it.
 *
 * Also the drag's juice (lap-3 D4): lifting a card (a drag start or a hold, once for a hold that
 * turns into a drag), moving it over the feed, letting go elsewhere, and the chart's forecast
 * appearing.
 */
export function useCardForecast({
  draft,
  detailCard,
  cardElement,
  feedId,
}: UseCardForecastOptions): CardForecast {
  const [dragged, setDragged] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<Record<CardPreviewSource, string | null>>({
    hold: null,
    focus: null,
  });
  const previewedCard = firstPreviewed(draft, [
    dragged,
    previewed.hold,
    detailCard?.id,
    previewed.focus,
  ]);
  const shownId = previewedCard?.id ?? null;

  useEffect(() => {
    if (shownId) emitJuice("forecast.shown");
  }, [shownId]);

  const { pickUp, dragEvents, endDrag } = dragJuice({
    draft,
    cardElement,
    feedId,
    held: previewed.hold,
    setDragged,
  });

  return {
    forecast: previewedCard?.forecast ?? null,
    forecastText: previewedCard?.forecastText ?? null,
    onPreview: (source, cardId) => {
      if (source === "hold" && cardId && cardId !== dragged) pickUp(cardId);
      setPreviewed((current) => ({ ...current, [source]: cardId }));
    },
    dragging: dragged !== null,
    dragEvents,
    endDrag,
  };
}
