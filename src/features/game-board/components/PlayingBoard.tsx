import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Pause } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MuteToggle } from "@/features/game-audio/api";
import { useBoardScreenReader } from "@/features/game-board/hooks/useBoardScreenReader";
import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import type { CommentBatch } from "@/features/follower-comments/api";
import { EventModal } from "@/features/game-flow/api";
import { JuiceLayer, juiceActionForPost, useActionJuice } from "@/features/game-juice/api";
import { UI_COPY } from "@/features/game-content/api";
import { cn } from "@/shared/utils/cn";
import type { BoardView, DraftCardView } from "@/features/game-board/types/gameBoard.types";
import { CardDetailDialog } from "./CardDetailDialog";
import { CardDraft, draftCardElement } from "./CardDraft";
import { MeterPanel } from "./MeterPanel";
import { PauseMenu } from "./PauseMenu";
import { PhaseProgress } from "./PhaseProgress";
import { FEED_DROP_ID, PhoneFeed } from "./PhoneFeed";

/** Pixels a pointer moves before a press becomes a drag (mobile-fit D1). */
const DRAG_START_DISTANCE = 6;
const POINTER_OPTIONS = { activationConstraint: { distance: DRAG_START_DISTANCE } };

/**
 * Board grid (mobile-fit D2). Portrait: header, meters, feed (takes the rest), draft. Split
 * (sideways phone or large screen): header, meters and feed left, the draft right. Top and bottom
 * padding grow into the notch and home-indicator insets; the body already pads the sides.
 */
const BOARD_GRID = cn(
  "mx-auto grid h-dvh w-full max-w-6xl grid-cols-1 grid-rows-[auto_auto_minmax(6rem,1fr)_auto] gap-2 overflow-hidden overscroll-none px-3 touch-manipulation sm:gap-3 sm:px-6",
  "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
  "board-split:grid-cols-2 board-split:grid-rows-[auto_auto_minmax(0,1fr)] board-split:gap-x-4"
);

export interface PlayingBoardProps {
  view: BoardView;
  /** The followers' comments per session step: shown under each feed post, the newest revealed with the juice (feed-comments D1). */
  comments: Array<CommentBatch | null>;
  /** The run continues a save: the board announces where the player is (local-save D5). */
  resumed: boolean;
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
export const PlayingBoard = (props: PlayingBoardProps) => {
  const { view, play, chooseOption, onQuit, withTap } = props;
  const shownEvent = useRetainedValue(view.event);
  const [detailCard, setDetailCard] = useState<DraftCardView | null>(null);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Mouse, touch and pen alike: a drag starts on the first move past 6px, a tap stays a click (D3).
  const sensors = useSensors(useSensor(PointerSensor, POINTER_OPTIONS));

  // True from the event's arrival until its dialog has fully closed (onCloseAutoFocus).
  const [eventDialogMounted, setEventDialogMounted] = useState(false);
  if (view.event !== null && !eventDialogMounted) setEventDialogMounted(true);
  const dialogOpen = view.event !== null || eventDialogMounted;
  const screenReader = useBoardScreenReader(view, dialogOpen, props.resumed);

  // An event post plays its option kind's card juice once the event dialog has closed, so the
  // meters count, flash and throw particles in sight, not behind the overlay (event-juice-drop D1, D3).
  const juice = useActionJuice({
    action: juiceActionForPost(view.feed[0]),
    meters: view.meters,
    key: view.feed.length,
    hold: view.feed[0]?.type === "event" && eventDialogMounted,
  });

  /** Particles start where the card was (or was dropped), so mark it before it leaves. */
  /** From a drag or the detail dialog's "In de feed" (closing the dialog is a no-op after a drag). */
  const playCard = (cardId: string): void => {
    setDetailCard(null);
    screenReader.rememberSlot(view.draft.findIndex((card) => card.id === cardId));
    juice.markOrigin(draftCardElement(cardId));
    play(cardId);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    setDragging(false);
    if (over?.id === FEED_DROP_ID) playCard(String(active.id));
  };

  /** A tap or Enter opens the details (game-board D2); focus comes back to this slot after. */
  const showDetails = (card: DraftCardView): void => {
    screenReader.rememberSlot(view.draft.findIndex((draft) => draft.id === card.id));
    setDetailCard(card);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <div ref={juice.shakeRef} data-viewport-lock className={BOARD_GRID}>
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
          meters={juice.meters}
          version={juice.key}
          accents={juice.plan?.accents}
          flashes={juice.plan?.flashes}
          countUp={juice.plan?.countUp ?? true}
        />
        <PhoneFeed
          entries={view.feed}
          comments={props.comments}
          revealKey={juice.key}
          dragging={dragging}
        />
        <div className="board-split:col-start-2 board-split:row-span-3 board-split:row-start-1 board-split:flex board-split:min-h-0 board-split:flex-col board-split:justify-center">
          <CardDraft cards={view.draft} onShowDetails={showDetails} />
        </div>
      </div>
      <JuiceLayer burst={juice.burst} />
      <p aria-live="polite" className="sr-only">
        <span key={screenReader.announcement.key}>{screenReader.announcement.text}</span>
      </p>
      <CardDetailDialog
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onPlay={playCard}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          screenReader.focusDraftSlot();
        }}
      />
      <EventModal
        open={view.event !== null}
        event={shownEvent}
        onChoose={chooseOption}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          screenReader.focusDraftSlot();
          setEventDialogMounted(false);
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
