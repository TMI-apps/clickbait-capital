import { useNavigate } from "react-router-dom";
import { GAME_CONTENT } from "@/features/game-content/api";
import { GameBoard } from "@/features/game-board/api";

/**
 * `/spel`: one run of the game. The content set is chosen here, so swapping it is a
 * one-line change.
 */
export const GamePage = () => {
  const navigate = useNavigate();
  return <GameBoard content={GAME_CONTENT} onQuit={() => navigate("/")} />;
};
