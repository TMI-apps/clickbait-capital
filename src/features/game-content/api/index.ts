/**
 * Public API of the game-content feature: the full Dutch deck as a `GameContent` for the
 * engine, presentation lookups, phase intros, end screens and UI copy. Other features and
 * pages import only from here (`@/features/game-content/api`).
 */
export {
  GAME_CONTENT,
  getContentCard,
  getContentEvent,
} from "@/features/game-content/services/gameContent";
export type { ContentCard, ContentEvent } from "@/features/game-content/services/gameContent";
export { PHASE_INTROS } from "@/features/game-content/services/phases";
export {
  buildEndReport,
  END_REPORT_TEMPLATE,
  fillTemplate,
  GAME_OVER_TEXTS,
  selectGameOverText,
} from "@/features/game-content/services/endings";
export { GLOSSARY, UI_COPY } from "@/features/game-content/services/uiCopy";
export type * from "@/features/game-content/types/contentPresentation.types";
