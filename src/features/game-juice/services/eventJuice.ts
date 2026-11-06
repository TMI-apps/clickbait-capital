import type { JuiceAction, JuiceEventKind } from "@/features/game-juice/types/juice.types";

/** A feed post as the juice reads it: a card type or "event" with the chosen option's kind. */
export interface JuicePost {
  type: JuiceAction;
  optionKind?: JuiceEventKind;
}

/**
 * The card juice an event option earns (event-juice-drop D1): engagement plays like a viral
 * card, commercial like an ad, journalism like news — ethics stays dull (design § 5).
 */
const EVENT_KIND_ACTION: Record<JuiceEventKind, JuiceAction> = {
  engagement: "viral",
  commercial: "ad",
  journalism: "news",
};

/** Juice action for an answered event; plain "event" (flash only) when the kind is unknown. */
export function juiceActionForEvent(kind: JuiceEventKind | undefined): JuiceAction {
  return kind ? EVENT_KIND_ACTION[kind] : "event";
}

/** The juice of the newest post: its card type, or an answered event's option kind; null before any. */
export function juiceActionForPost(post: JuicePost | undefined): JuiceAction | null {
  if (!post) return null;
  return post.type === "event" ? juiceActionForEvent(post.optionKind) : post.type;
}
