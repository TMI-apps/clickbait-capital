/**
 * Copy-only entry of the game-content api: `UI_COPY` without the deck. App-shell code in the
 * main chunk (app-status) imports from here, so the card deck stays in the lazy game chunk.
 */
export { UI_COPY } from "@/features/game-content/services/uiCopy";
