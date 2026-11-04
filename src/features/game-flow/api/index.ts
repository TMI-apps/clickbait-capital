/**
 * Public API of the game-flow feature: the screens between board turns (event modal, phase
 * transition, ending and results). The board imports only from here
 * (`@/features/game-flow/api`).
 */
export { EventModal, type EventModalProps } from "@/features/game-flow/components/EventModal";
export { GameEndFlow, type GameEndFlowProps } from "@/features/game-flow/components/GameEndFlow";
export {
  PhaseTransitionScreen,
  type PhaseTransitionScreenProps,
} from "@/features/game-flow/components/PhaseTransitionScreen";
export { usePhaseIntro, type PhaseIntroState } from "@/features/game-flow/hooks/usePhaseIntro";
export type * from "@/features/game-flow/types/gameFlow.types";
