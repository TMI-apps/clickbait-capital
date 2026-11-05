import type { JuiceAction } from "@/features/game-juice/types/juice.types";

/**
 * How a new post enters the feed, per action (design § 5): viral and ad pop in with the
 * springy card ease, news slides in tight and dry with no overshoot. Durations come from the
 * motion tokens, so reduced motion makes every entrance near-instant.
 */
export const FEED_ENTRANCE: Record<JuiceAction, string> = {
  viral: "animate-juice-pop",
  ad: "animate-juice-pop",
  news: "animate-juice-slide",
  event: "animate-card-draw",
};
