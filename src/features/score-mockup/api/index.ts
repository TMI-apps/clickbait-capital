/**
 * Public API of the score-mockup feature: a throwaway prototype of the score redesign on fake
 * data (`/mockup/score?v=a|b|c`). Deleted when the real score HUD lands in game-board.
 */
export { ScoreMockup } from "@/features/score-mockup/components/ScoreMockup";
export type { ScoreMockupProps } from "@/features/score-mockup/components/ScoreMockup";
export type { ScoreHudVariant } from "@/features/score-mockup/types/scoreMockup.types";
