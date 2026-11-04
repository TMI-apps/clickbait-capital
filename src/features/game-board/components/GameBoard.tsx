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
import type { GameContent } from "@/features/game-engine/api";
import { Button } from "@/components/common/Button";
import { useGameSession } from "@/features/game-board/hooks/useGameSession";
import { useRetainedValue } from "@/features/game-board/hooks/useRetainedValue";
import {
  EventModal,
  GameEndFlow,
  PhaseTransitionScreen,
  usePhaseIntro,
} from "@/features/game-flow/api";
import { UI_COPY } from "@/features/game-content/api";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";
import { CardDetailDialog } from "./CardDetailDialog";
import { CardDraft } from "./CardDraft";
import { MeterPanel } from "./MeterPanel";
import { PauseMenu } from "./PauseMenu";
import { PhaseProgress } from "./PhaseProgress";
import { FEED_DROP_ID, PhoneFeed } from "./PhoneFeed";

export interface GameBoardProps {
  /** Cards, events, phases and balance. Swap the content set here, not in the board. */
  content: GameContent;
  /** Leave the game (pause menu "Stoppen", end screen "Home"). */
  onQuit: () => void;
  /** Fixed seed for tests and replays; random per run otherwise. */
  seed?: number;
}

/**
 * The playable board: meters, phase progress, the phone feed and the 3-card draft, plus the
 * card detail and pause dialogs. The game-flow screens take over between turns: the event
 * modal over the board, and full-screen phase transitions and endings instead of it
 * (game-flow D1, D2). All game state comes from `useGameSession`.
 */
export const GameBoard = ({ content, onQuit, seed }: GameBoardProps) => {
  const { view, play, chooseOption, restart } = useGameSession({ content, seed });
  const phaseIntro = usePhaseIntro(view.phase.phaseId);
  const shownEvent = useRetainedValue(view.event);
  const [detailCard, setDetailCard] = useState<DraftCardView | null>(null);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    setDragging(false);
    if (over?.id === FEED_DROP_ID) play(String(active.id));
  };

  const playFromDetails = (cardId: string): void => {
    setDetailCard(null);
    play(cardId);
  };

  const restartRun = (): void => {
    phaseIntro.reset();
    restart();
  };

  if (view.end) {
    return <GameEndFlow summary={view.end} onRestart={restartRun} onQuit={onQuit} />;
  }
  if (phaseIntro.pendingPhase !== null) {
    return <PhaseTransitionScreen phase={view.phase} onContinue={phaseIntro.dismiss} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-2 overflow-x-hidden overflow-y-auto px-3 py-2 sm:gap-3 sm:px-6 sm:py-4">
        <header className="flex shrink-0 items-start gap-2">
          <PhaseProgress phase={view.phase} />
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label={UI_COPY.board.menuButton}
            onClick={() => setPaused(true)}
          >
            <Pause aria-hidden="true" />
          </Button>
        </header>
        <MeterPanel meters={view.meters} version={view.feed.length} />
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(6rem,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-1 lg:items-stretch">
          <PhoneFeed entries={view.feed} dragging={dragging} />
          <div className="lg:flex lg:flex-col lg:justify-center">
            <CardDraft cards={view.draft} onPlay={play} onShowDetails={setDetailCard} />
          </div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {view.feed[0] ? `Geplaatst: ${view.feed[0].title}` : ""}
      </p>
      <CardDetailDialog
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onPlay={playFromDetails}
      />
      <EventModal open={view.event !== null} event={shownEvent} onChoose={chooseOption} />
      <PauseMenu open={paused} onResume={() => setPaused(false)} onQuit={onQuit} />
    </DndContext>
  );
};
