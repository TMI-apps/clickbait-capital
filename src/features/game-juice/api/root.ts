/**
 * Lazy entry of the game's juice host: `App.tsx` imports this file with `React.lazy`, so the
 * director, effects and recipes stay out of the main chunk (juice-core D5, A1).
 */
export { GameJuiceRoot } from "@/features/game-juice/components/GameJuiceRoot";
