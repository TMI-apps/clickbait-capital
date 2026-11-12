import type { GameContent } from "@/features/game-engine/api";
import type { SavedRun } from "@/features/game-save/api";
import { useBoardFollowUp } from "@/features/game-board/hooks/useBoardJuice";
import { useBoardSession } from "@/features/game-board/hooks/useBoardSession";
import { GameEndFlow, PhaseTransitionScreen, usePhaseIntro } from "@/features/game-flow/api";
import { emitJuice } from "@/features/game-juice/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import { PlayingBoard } from "./PlayingBoard";

export interface GameBoardProps {
  /** Cards, events, phases and balance. Swap the content set here, not in the board. */
  content: GameContent;
  /** Leave the game (pause menu "Stoppen", end screen "Home"). */
  onQuit: () => void;
  /** Fixed seed for tests and replays; random per run otherwise. */
  seed?: number;
  /** Continue this saved run instead of starting a new one (local-save D1). */
  savedRun?: SavedRun | null;
}

/**
 * One run of the game: the playing board, and the game-flow screens that replace it between
 * turns — full-screen phase transitions and the endings (game-flow D1, D2). All game state
 * comes from the game-session run, as the board sees it (`useBoardSession`).
 */
export const GameBoard = ({ content, onQuit, seed, savedRun }: GameBoardProps) => {
  const { view, play, chooseOption, restart, juice, comments, resumed, seenPhase } =
    useBoardSession({
      content,
      seed,
      savedRun,
    });
  useBoardFollowUp(juice);
  const phaseIntro = usePhaseIntro(view.phase.phaseId, seenPhase);
  const endScreen = useJuiceAnchor("end-screen");

  /** Main buttons give a soft tap (`ui.press`); card plays and event answers have their own juice. */
  const withTap = (action: () => void) => (): void => {
    emitJuice("ui.press");
    action();
  };

  const restartRun = (): void => {
    phaseIntro.reset();
    restart();
  };

  if (view.end) {
    return (
      // The end screen's entrance, confetti and flash are `run.won` / `run.lost` recipes.
      <div ref={endScreen}>
        <GameEndFlow summary={view.end} onRestart={withTap(restartRun)} onQuit={withTap(onQuit)} />
      </div>
    );
  }
  if (phaseIntro.pendingPhase !== null) {
    return <PhaseTransitionScreen phase={view.phase} onContinue={withTap(phaseIntro.dismiss)} />;
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
      withTap={withTap}
    />
  );
};
