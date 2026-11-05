import { useNavigate } from "react-router-dom";
import { GAME_CONTENT } from "@/features/game-content/api";
import { GameBoard } from "@/features/game-board/api";
import { ResumeScreen } from "@/features/game-flow/api";
import { useRunStart } from "@/features/game-save/api";

/**
 * `/spel`: one run of the game. With a saved run the player first chooses to continue it or
 * start over (local-save D4). The content set is chosen here, so swapping it is a one-line
 * change.
 */
export const GamePage = () => {
  const navigate = useNavigate();
  const run = useRunStart();
  if (run.start === "ask") {
    return <ResumeScreen onResume={run.resume} onNewGame={run.startNew} />;
  }
  return <GameBoard content={GAME_CONTENT} savedRun={run.savedRun} onQuit={() => navigate("/")} />;
};
