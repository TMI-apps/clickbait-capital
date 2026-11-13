import type {
  JuiceChartMoveTier,
  JuiceChartMoveVariant,
  JuiceMeterKey,
  JuiceStreakStep,
} from "@/features/game-juice/types/gameJuiceEvents.types";

/** The two chart lines (Gebruikers, Geld). */
export type ChartJuiceLine = Exclude<JuiceMeterKey, "reputation">;

/** Where a tier starts: the move as a share of the line's goal (the visible distance on the chart). */
export interface ChartMoveThresholds {
  medium: number;
  big: number;
  huge: number;
}

/**
 * Tier thresholds per line (chart-juice D1): a move of at least `medium` × the goal is medium,
 * and so on. Tuned on the balance simulation's moves: Geld moves about half as far per action as
 * Gebruikers, so its steps are lower and a run still shows every tier on both lines. Edit here;
 * the inspector (`/juice`) shows them.
 */
export const CHART_MOVE_TIERS: Record<ChartJuiceLine, ChartMoveThresholds> = {
  users: { medium: 0.08, big: 0.25, huge: 0.6 },
  revenue: { medium: 0.04, big: 0.12, huge: 0.4 },
};

/**
 * Streak levels (chart-juice D3): from the first the counter shows its 🔥 streak chip and the
 * line glows; each level glows brighter and plays a bigger step. Every step past the first rises
 * in pitch (`streak.step` variants).
 */
export const STREAK_LEVELS = [3, 5, 8] as const;

/** The tier of a move of `share` × the goal (either direction). */
export function chartMoveTier(line: ChartJuiceLine, share: number): JuiceChartMoveTier {
  const size = Math.abs(share);
  const tiers = CHART_MOVE_TIERS[line];
  if (size >= tiers.huge) return "huge";
  if (size >= tiers.big) return "big";
  return size >= tiers.medium ? "medium" : "small";
}

/** The `chart.moved` variant of a move: direction and tier, or `dull` (news, journalism). */
export function chartMoveVariant(
  line: ChartJuiceLine,
  share: number,
  dull: boolean
): JuiceChartMoveVariant {
  if (dull) return "dull";
  return `${share > 0 ? "up" : "down"}-${chartMoveTier(line, share)}`;
}

/** The streak's level: 0 below the first level, else 1–3. */
export function streakLevel(count: number): 0 | 1 | 2 | 3 {
  return STREAK_LEVELS.filter((level) => count >= level).length as 0 | 1 | 2 | 3;
}

/** The `streak.step` variant of a streak `count` long, or null below the first level. */
export function streakStepVariant(count: number): JuiceStreakStep | null {
  if (count < STREAK_LEVELS[0]) return null;
  return String(Math.min(count, STREAK_LEVELS[STREAK_LEVELS.length - 1])) as JuiceStreakStep;
}
