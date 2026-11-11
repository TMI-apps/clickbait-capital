import type { ThumbnailTreatment } from "@/components/common/ThumbnailFrame";

/**
 * Public data shape of the GameCard kit component. Presentation only: a game feature
 * maps its own card model onto these props (no game logic or feature imports here).
 */

/** Card type: drives frame colour, type chip icon and Dutch label. */
export type GameCardType = "viral" | "ad" | "news" | "event";

/** Meter a card effect moves: Geld, Gebruikers, Reputatie. */
export type GameCardMeter = "revenue" | "users" | "reputation";

/** Rarity tier; `common` shows no badge. */
export type GameCardRarity = "common" | "rare" | "legendary";

/**
 * Card size. `compact` fits three cards in a row on a 390px phone: tighter padding, short
 * type label, effect rows as meter icon + number (meter name stays for screen readers),
 * no flavor text (show it in a detail view instead).
 */
export type GameCardSize = "default" | "compact";

/** Entrance or exit animation (motion tokens; near-instant under reduced motion). */
export type GameCardAnimation = "draw" | "play";

/** One meter effect, shown as a signed number with arrow, meter icon and meter name. */
export interface GameCardEffect {
  meter: GameCardMeter;
  /** Signed change, e.g. 12 or -5. Zero renders as "±0". */
  delta: number;
  /**
   * Part of a gain lost to the meter's cap (meter would pass its maximum). Shows a greyed
   * "MAX" mark next to `delta`, which then holds only the part that still counts.
   */
  overflow?: number;
  /**
   * The amount as text instead of `|delta|` (e.g. "12.000" or "€ 2.000" for absolute changes).
   * Unsigned: the arrow, sign and spoken direction still come from `delta`.
   */
  amountText?: string;
}

/** Card artwork. `alt` is required: describe the picture, or pass "" only if purely decorative. */
export interface GameCardImage {
  src: string;
  alt: string;
  /** Point to keep in view when the image is cropped, in percent (0–100). Default: centre. */
  focalPoint?: { x: number; y: number };
  /** Caption, sticker and marker drawn over the photo (the colour boost and outline are always on). */
  thumbnail?: ThumbnailTreatment;
}
