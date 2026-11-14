import type { GameContent } from "@/features/game-engine/api";
import type { SavedRun } from "@/features/game-save/api";
import { useBoardFollowUp } from "@/features/game-board/hooks/useBoardJuice";
import { useBoardSession } from "@/features/game-board/hooks/useBoardSession";
import { GameEndFlow, PhaseTransitionScreen, usePhaseIntro } from "@/features/game-flow/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import { PlayingBoard } from "./PlayingBoard";

export interface GameBoardProps {
  /** Cards, events, phases and balance. Swap the content set here, not in the board. */
  content: GameContent;
  /** Leave the game (the board's home button, end screen "Naar het begin"). */
  onQuit: () => void;
  /** Fixed seed for tests and replays; random per run otherwise. */
  seed?: number;
  /** Continue this saved run instead of starting a new one (local-save D1). */
  savedRun?: SavedRun | null;
  /** The name the player gave their app for a new run (app-name lap); a resumed run keeps its own. */
  appName?: string;
}

/**
 * One run of the game: the playing board, and the game-flow screens that replace it between
 * turns — full-screen phase transitions and the endings (game-flow D1, D2). All game state
 * comes from the game-session run, as the board sees it (`useBoardSession`).
 */
export const GameBoard = ({ content, onQuit, seed, savedRun, appName }: GameBoardProps) => {
  const { view, play, chooseOption, restart, juice, comments, resumed, seenPhase } =
    useBoardSession({
      content,
      seed,
      savedRun,
      appName,
    });
  useBoardFollowUp(juice);
  const phaseIntro = usePhaseIntro(view.phase.phaseId, seenPhase);
  const endScreen = useJuiceAnchor("end-screen");

  const restartRun = (): void => {
    phaseIntro.reset();
    restart();
  };

  if (view.end) {
    return (
      // The end screen's entrance, confetti and flash are `run.won` / `run.lost` recipes.
      <div ref={endScreen}>
        <GameEndFlow summary={view.end} onRestart={restartRun} onQuit={onQuit} />
      </div>
    );
  }
  if (phaseIntro.pendingPhase !== null) {
    return (
      <PhaseTransitionScreen
        phase={view.phase}
        appName={view.appName}
        onContinue={phaseIntro.dismiss}
      />
    );
  }
  return (
    <PlayingBoard
      view={view}
      reveal={juice.reveal}
      comments={comments}
      resumed={resumed}
      play={play}
      chooseOption={chooseOption}
      onQuit={onQuit}
    />
  );
};
