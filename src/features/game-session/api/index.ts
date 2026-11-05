/**
 * Public API of the game-session feature: one run over the rules engine, its replay from a
 * save and the device save. Other features import only from here (`@/features/game-session/api`).
 */
export { useGameSession } from "@/features/game-session/hooks/useGameSession";
export type {
  GameSession,
  UseGameSessionOptions,
} from "@/features/game-session/hooks/useGameSession";
export type { SessionState, SessionStep } from "@/features/game-session/services/gameSession";
