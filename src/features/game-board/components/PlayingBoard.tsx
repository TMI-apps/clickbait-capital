import { useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Pause } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MuteToggle } from "@/features/game-audio/api";
import { useBoardScreenReader } from "@/features/game-board/hooks/useBoardScreenReader";
import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import { EventModal } from "@/features/game-flow/api";
import { JuiceLayer, useActionJuice } from "@/features/game-juice/api";
import { UI_COPY } from "@/features/game-content/api";
import type { BoardView, DraftCardView } from "@/features/game-board/types/gameBoard.types";
import { CardDetailDialog } from "./CardDetailDialog";
import { CardDraft, draftCardElement } from "./CardDraft";
import { MeterPanel } from "./MeterPanel";
import { PauseMenu } from "./PauseMenu";
import { PhaseProgress } from "./PhaseProgress";
import { FEED_DROP_ID, PhoneFeed } from "./PhoneFeed";

export interface PlayingBoardProps {
  view: BoardView;
  play: (cardId: string) => void;
  chooseOption: (optionId: string) => void;
  onQuit: () => void;
  /** Wraps a main-button action with the UI tap sound. */
  withTap: (action: () => void) => () => void;
}

/**
 * The board during play: meters, phase progress, the phone feed and the 3-card draft, plus
 * the event modal, card detail and pause dialogs, and the drag context.
 */
export const PlayingBoard = ({ view, play, chooseOption, onQuit, withTap }: PlayingBoardProps) => {
  const shownEvent = useRetainedValue(view.event);
  const [detailCard, setDetailCard] = useState<DraftCardView | null>(null);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const screenReader = useBoardScreenReader(view);

  const juice = useActionJuice({
    action: view.feed[0]?.type ?? null,
    meters: view.meters,
    key: view.feed.length,
  });

  /** Particles start where the card was (or was dropped), so mark it before it leaves. */
  const playCard = (cardId: string): void => {
    screenReader.rememberSlot(view.draft.findIndex((card) => card.id === cardId));
    juice.markOrigin(draftCardElement(cardId));
    play(cardId);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    setDragging(false);
    if (over?.id === FEED_DROP_ID) playCard(String(active.id));
  };

  const playFromDetails = (cardId: string): void => {
    setDetailCard(null);
    playCard(cardId);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={juice.shakeRef}
        className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-2 overflow-x-hidden overflow-y-auto px-3 py-2 sm:gap-3 sm:px-6 sm:py-4"
      >
        <header className="flex shrink-0 items-start gap-2">
          <PhaseProgress phase={view.phase} />
          <MuteToggle compact className="size-11 shrink-0" />
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label={UI_COPY.board.menuButton}
            onClick={withTap(() => setPaused(true))}
          >
            <Pause aria-hidden="true" />
          </Button>
        </header>
        <MeterPanel
          meters={view.meters}
          version={view.feed.length}
          accents={juice.plan?.accents}
          flashes={juice.plan?.flashes}
          countUp={juice.plan?.countUp ?? true}
        />
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(6rem,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-1 lg:items-stretch">
          <PhoneFeed entries={view.feed} dragging={dragging} />
          <div className="lg:flex lg:flex-col lg:justify-center">
            <CardDraft cards={view.draft} onPlay={playCard} onShowDetails={setDetailCard} />
          </div>
        </div>
      </div>
      <JuiceLayer burst={juice.burst} />
      <p aria-live="polite" className="sr-only">
        <span key={screenReader.announcement.key}>{screenReader.announcement.text}</span>
      </p>
      <CardDetailDialog
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onPlay={playFromDetails}
      />
      <EventModal
        open={view.event !== null}
        event={shownEvent}
        onChoose={chooseOption}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          screenReader.focusDraftSlot();
        }}
      />
      <PauseMenu
        open={paused}
        onResume={withTap(() => setPaused(false))}
        onQuit={withTap(onQuit)}
      />
    </DndContext>
  );
};
