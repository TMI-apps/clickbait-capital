import type { GameContent } from "@/features/game-engine/api";
import { useSoundEffects } from "@/features/game-audio/api";
import { useBoardSounds } from "@/features/game-board/hooks/useBoardSounds";
import { useGameSession } from "@/features/game-board/hooks/useGameSession";
import { GameEndFlow, PhaseTransitionScreen, usePhaseIntro } from "@/features/game-flow/api";
import { PlayingBoard } from "./PlayingBoard";

export interface GameBoardProps {
  /** Cards, events, phases and balance. Swap the content set here, not in the board. */
  content: GameContent;
  /** Leave the game (pause menu "Stoppen", end screen "Home"). */
  onQuit: () => void;
  /** Fixed seed for tests and replays; random per run otherwise. */
  seed?: number;
}

/**
 * One run of the game: the playing board, and the game-flow screens that replace it between
 * turns — full-screen phase transitions and the endings (game-flow D1, D2). All game state
 * comes from `useGameSession`.
 */
export const GameBoard = ({ content, onQuit, seed }: GameBoardProps) => {
  const { view, play, chooseOption, restart, sounds } = useGameSession({ content, seed });
  const { play: playSound } = useSoundEffects();
  useBoardSounds(sounds);
  const phaseIntro = usePhaseIntro(view.phase.phaseId);

  /** Main buttons give a soft tap; card plays and event answers have their own sounds. */
  const withTap = (action: () => void) => (): void => {
    playSound("ui-tap");
    action();
  };

  const restartRun = (): void => {
    phaseIntro.reset();
    restart();
  };

  if (view.end) {
    return (
      <GameEndFlow summary={view.end} onRestart={withTap(restartRun)} onQuit={withTap(onQuit)} />
    );
  }
  if (phaseIntro.pendingPhase !== null) {
    return <PhaseTransitionScreen phase={view.phase} onContinue={withTap(phaseIntro.dismiss)} />;
  }
  return (
    <PlayingBoard
      view={view}
      play={play}
      chooseOption={chooseOption}
      onQuit={onQuit}
      withTap={withTap}
    />
  );
};
