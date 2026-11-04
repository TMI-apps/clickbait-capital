import { useNavigate } from "react-router-dom";
import { SEED_CONTENT } from "@/features/game-engine/api";
import { GameBoard } from "@/features/game-board/api";

/**
 * `/spel`: one run of the game. The content set is chosen here (seed content until the
 * game-content lap lands), so swapping it is a one-line change.
 */
export const GamePage = () => {
  const navigate = useNavigate();
  return <GameBoard content={SEED_CONTENT} onQuit={() => navigate("/")} />;
};
