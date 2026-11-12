/**
 * Public API of the game-juice feature (action feedback: particles, shake, meter accents,
 * count-up, entrances). Other features import only from here (`@/features/game-juice/api`).
 */
export { CountUpNumber } from "@/features/game-juice/components/CountUpNumber";
export type { CountUpNumberProps } from "@/features/game-juice/components/CountUpNumber";
export { EffectsJuice } from "@/features/game-juice/components/EffectsJuice";
export type { EffectsJuiceProps } from "@/features/game-juice/components/EffectsJuice";
export { EndJuice } from "@/features/game-juice/components/EndJuice";
export type { EndJuiceProps } from "@/features/game-juice/components/EndJuice";
export { JuiceLayer } from "@/features/game-juice/components/JuiceLayer";
export type { JuiceLayerProps } from "@/features/game-juice/components/JuiceLayer";
export { MeterJuice } from "@/features/game-juice/components/MeterJuice";
export type { MeterJuiceProps } from "@/features/game-juice/components/MeterJuice";
export { JUICE_METER_ATTR, useActionJuice } from "@/features/game-juice/hooks/useActionJuice";
export type { ActionJuice, ParticleBurst } from "@/features/game-juice/hooks/useActionJuice";
export { juiceActionForEvent, juiceActionForPost } from "@/features/game-juice/services/eventJuice";
export type { JuicePost } from "@/features/game-juice/services/eventJuice";
export { FEED_ENTRANCE } from "@/features/game-juice/services/feedEntrance";
export type {
  JuiceAction,
  JuiceEventKind,
  JuiceMeter,
  MeterAccent,
  MeterFlash,
} from "@/features/game-juice/types/juice.types";
export {
  GAME_JUICE_BOOK,
  GAME_JUICE_STORAGE_KEY,
  createGameJuiceEffects,
  emitJuice,
  gameJuiceBus,
  getGameJuiceTuning,
} from "@/features/game-juice/services/gameJuiceRuntime";
export type { GameJuiceEvents } from "@/features/game-juice/services/gameJuiceRuntime";
export { GAME_JUICE_RECIPES } from "@/features/game-juice/services/gameJuiceRecipes";
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
} from "@/features/game-juice/types/gameJuiceEvents.types";
