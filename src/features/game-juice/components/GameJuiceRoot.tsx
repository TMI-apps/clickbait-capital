import { JuiceStage } from "@/features/juice-engine/api";
import { useGameJuiceDirector } from "@/features/game-juice/hooks/useGameJuiceDirector";
import { useJuicePress } from "@/features/game-juice/hooks/useJuicePress";
import { usePageJuice } from "@/features/game-juice/hooks/usePageJuice";

/**
 * The game's juice host, mounted once (lazily) in `App.tsx`: the overlay stage plus the director
 * that turns every emitted juice event into its recipe, the app-wide press tap and the page
 * entrance on navigation. Renders nothing visible on its own. Must sit inside the router.
 */
export const GameJuiceRoot = () => {
  useGameJuiceDirector();
  useJuicePress();
  usePageJuice();
  return <JuiceStage />;
};
