import {
  createJuiceBus,
  createJuiceTuning,
  type JuiceEffect,
  type JuiceEffectRegistry,
  type JuicePayload,
  type JuiceRecipeBook,
  type JuiceTuningStore,
} from "@/features/juice-engine/api";
import {
  badgeEffect,
  calloutEffect,
  createSoundEffect,
  enterEffect,
  flashEffect,
  floaterEffect,
  glowEffect,
  hapticEffect,
  particlesEffect,
  popEffect,
  pulseEffect,
  shakeEffect,
  timeWarpEffect,
  tintEffect,
  zoomEffect,
  type SoundPort,
} from "@/features/juice-effects/api";
import { GAME_STORAGE_PREFIX } from "@/features/game-settings/api";
import { GAME_JUICE_RECIPES } from "@/features/game-juice/services/gameJuiceRecipes";
import type { GameJuiceCatalog } from "@/features/game-juice/types/gameJuiceEvents.types";

/** Payload of each catalog event: its variant / vars plus the engine's origin and strength. */
export type GameJuiceEvents = {
  [K in keyof GameJuiceCatalog]: Omit<JuicePayload, "variant" | "vars"> & GameJuiceCatalog[K];
};

/** One event with its payload, for code that collects several before emitting (the board). */
export type GameJuiceEmit = {
  [K in keyof GameJuiceEvents]: { name: K; payload: GameJuiceEvents[K] };
}[keyof GameJuiceEvents];

/** The page's juice bus: gameplay and UI announce moments here. */
export const gameJuiceBus = createJuiceBus<GameJuiceEvents>();

/**
 * Announces a juice moment, e.g. `emitJuice("card.played", { variant: "viral", origin: card })`.
 * Never throws; with no `GameJuiceRoot` mounted it does nothing.
 */
export const emitJuice = gameJuiceBus.emit;

/** Ends the running recipes with this tag, e.g. `stopJuice(EVENT_OUTCOME_TAG)` when its dialog closes. */
export const stopJuice = gameJuiceBus.stop;

/** Emits a collected event (see `GameJuiceEmit`). */
export function emitJuiceEvent({ name, payload }: GameJuiceEmit): void {
  (gameJuiceBus.emit as (event: string, data: JuicePayload) => void)(name, payload);
}

/** Where the inspector's overrides persist; the game prefix lets "Voortgang wissen" clear them. */
export const GAME_JUICE_STORAGE_KEY = `${GAME_STORAGE_PREFIX}juice-tuning`;

/** The recipes as the engine reads them (typed steps are plain data at runtime). */
export const GAME_JUICE_BOOK = GAME_JUICE_RECIPES as unknown as JuiceRecipeBook;

const localStorageAdapter = {
  read: (): string | null => window.localStorage.getItem(GAME_JUICE_STORAGE_KEY),
  write: (value: string | null): void => {
    if (value === null) window.localStorage.removeItem(GAME_JUICE_STORAGE_KEY);
    else window.localStorage.setItem(GAME_JUICE_STORAGE_KEY, value);
  },
};

let pageTuning: JuiceTuningStore | null = null;

/** The page-wide tuning store (recipes ⊕ inspector overrides), created on first use. */
export function getGameJuiceTuning(): JuiceTuningStore {
  pageTuning ??= createJuiceTuning({ book: GAME_JUICE_BOOK, storage: localStorageAdapter });
  return pageTuning;
}

/** Every effect the game's recipes may use; a new primitive is added here (juice-effects README). */
export function createGameJuiceEffects(sound: SoundPort): JuiceEffectRegistry {
  const effects: JuiceEffect[] = [
    createSoundEffect(sound),
    hapticEffect,
    shakeEffect,
    popEffect,
    pulseEffect,
    zoomEffect,
    enterEffect,
    timeWarpEffect,
    flashEffect,
    glowEffect,
    tintEffect,
    badgeEffect,
    particlesEffect,
    floaterEffect,
    calloutEffect,
  ];
  return Object.fromEntries(effects.map((effect) => [effect.id, effect]));
}
