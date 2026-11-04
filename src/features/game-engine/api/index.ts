/**
 * Public API of the game-engine feature. Other features and pages import only from here
 * (`@/features/game-engine/api`), never from services/ or types/ directly.
 */
export {
  createGame,
  drawHand,
  getHandCards,
  getPendingEvent,
  isJournalismDroughtActive,
  playCard,
  resolveEvent,
} from "@/features/game-engine/services/gameEngine";
export { scaleForPhase } from "@/features/game-engine/services/turnEffects";
export type { CreateGameOptions } from "@/features/game-engine/services/gameEngine";
export { SEED_CONTENT } from "@/features/game-engine/services/seedContent";
export type * from "@/features/game-engine/types/gameContent.types";
export type * from "@/features/game-engine/types/gameState.types";
