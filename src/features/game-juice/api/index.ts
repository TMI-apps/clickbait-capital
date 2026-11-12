/**
 * Public API of the game-juice feature: the game's juice catalog, recipes and `emitJuice`, plus
 * the outcome reveal and count-up. Other features import only from here
 * (`@/features/game-juice/api`); `App.tsx` lazy-loads `GameJuiceRoot` from `api/root.ts`.
 */
export { CountUpNumber } from "@/features/game-juice/components/CountUpNumber";
export type { CountUpNumberProps } from "@/features/game-juice/components/CountUpNumber";
export { EffectsJuice } from "@/features/game-juice/components/EffectsJuice";
export type { EffectsJuiceProps } from "@/features/game-juice/components/EffectsJuice";
export {
  GAME_JUICE_BOOK,
  GAME_JUICE_STORAGE_KEY,
  createGameJuiceEffects,
  emitJuice,
  emitJuiceEvent,
  gameJuiceBus,
  stopJuice,
  getGameJuiceTuning,
} from "@/features/game-juice/services/gameJuiceRuntime";
export type {
  GameJuiceEmit,
  GameJuiceEvents,
} from "@/features/game-juice/services/gameJuiceRuntime";
export {
  EVENT_OUTCOME_TAG,
  SCANDAL_WARNING_TAG,
  PHASE_INTRO_TAG,
  GAME_JUICE_RECIPES,
} from "@/features/game-juice/services/gameJuiceRecipes";
export type {
  GameJuiceRecipe,
  GameJuiceRecipeBook,
} from "@/features/game-juice/services/gameJuiceRecipes";
export type {
  GameJuiceCatalog,
  GameJuiceEventName,
  JuiceCardVariant,
  JuiceMeterKey,
  JuiceOptionVariant,
  JuicePhaseVariant,
  JuiceScandalLevel,
} from "@/features/game-juice/types/gameJuiceEvents.types";
