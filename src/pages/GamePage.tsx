import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAME_CONTENT } from "@/features/game-content/api";
import { GameBoard } from "@/features/game-board/api";
import { AppNameScreen } from "@/features/app-name/api";
import { ResumeScreen } from "@/features/game-flow/api";
import { useRunStart } from "@/features/game-save/api";

/**
 * `/spel`: one run of the game. With a saved run the player first chooses to continue it or
 * start over (local-save D4); a new run starts with naming the app (app-name lap). The content
 * set is chosen here, so swapping it is a one-line change.
 */
export const GamePage = () => {
  const navigate = useNavigate();
  const run = useRunStart();
  const [appName, setAppName] = useState<string | null>(null);
  if (run.start === "ask") {
    return (
      <ResumeScreen
        appName={run.savedRun?.appName}
        onResume={run.resume}
        onNewGame={run.startNew}
      />
    );
  }
  if (run.start === "new" && appName === null) {
    return <AppNameScreen onStart={setAppName} />;
  }
  return (
    <GameBoard
      content={GAME_CONTENT}
      savedRun={run.savedRun}
      appName={appName ?? undefined}
      onQuit={() => navigate("/")}
    />
  );
};
