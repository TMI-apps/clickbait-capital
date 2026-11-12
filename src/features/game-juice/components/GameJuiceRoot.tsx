import { JuiceStage } from "@/features/juice-engine/api";
import { useGameJuiceDirector } from "@/features/game-juice/hooks/useGameJuiceDirector";

/**
 * The game's juice host, mounted once (lazily) in `App.tsx`: the overlay stage plus the director
 * that turns every emitted juice event into its recipe. Renders nothing visible on its own.
 */
export const GameJuiceRoot = () => {
  useGameJuiceDirector();
  return <JuiceStage />;
};
