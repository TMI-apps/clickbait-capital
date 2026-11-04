import type { CardDefinition, EventDefinition, GameContent } from "@/features/game-engine/api";
import type {
  CardPresentation,
  EventPresentation,
} from "@/features/game-content/types/contentPresentation.types";
import { AD_CARDS } from "@/features/game-content/services/adCards";
import { EVENT_CARDS } from "@/features/game-content/services/eventCards";
import { NEWS_CARDS } from "@/features/game-content/services/newsCards";
import { CONTENT_BALANCE, CONTENT_PHASES } from "@/features/game-content/services/phases";
import { VIRAL_CARDS } from "@/features/game-content/services/viralCards";

/** A deck card with its presentation fields (flavor text, image hints). */
export type ContentCard = CardDefinition & CardPresentation;

/** An event with its image hints. */
export type ContentEvent = EventDefinition & EventPresentation;

/** The full deck the engine plays: pass it as `content` to `createGame`, `playCard`, `resolveEvent`. */
export const GAME_CONTENT: GameContent = {
  cards: [...VIRAL_CARDS, ...AD_CARDS, ...NEWS_CARDS],
  events: EVENT_CARDS,
  phases: CONTENT_PHASES,
  balance: CONTENT_BALANCE,
};

const CARDS_BY_ID = new Map<string, ContentCard>(
  [...VIRAL_CARDS, ...AD_CARDS, ...NEWS_CARDS].map((card) => [card.id, card])
);
const EVENTS_BY_ID = new Map<string, ContentEvent>(EVENT_CARDS.map((event) => [event.id, event]));

/** Card with flavor and image hints by engine card id (e.g. from `state.hand`), or null. */
export function getContentCard(cardId: string): ContentCard | null {
  return CARDS_BY_ID.get(cardId) ?? null;
}

/** Event with image hints by engine event id (e.g. `state.pendingEventId`), or null. */
export function getContentEvent(eventId: string): ContentEvent | null {
  return EVENTS_BY_ID.get(eventId) ?? null;
}
