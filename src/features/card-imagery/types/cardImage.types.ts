/**
 * Provenance and display data for the card and event pictures. Every picture is one the owner
 * assigned (owner-photos lap), so each entry carries the credit `/credits` shows (maker, source,
 * licence) next to what the board needs to show it.
 */

/**
 * Where a picture comes from: an Unsplash photo (credit maker + photo page; thumbnail-imagery D10),
 * TMI's own photo, an AI image TMI made, or a picture TMI supplied whose maker is not known.
 * Only the Unsplash License has a source page and a licence page.
 */
export type CardImageLicense =
  | "Unsplash License"
  | "Eigen foto TMI"
  | "AI-beeld van TMI"
  | "Aangeleverd door TMI";

/**
 * Thumbnail parts drawn in code over the photo (GameCard → ThumbnailFrame). Same shape as the
 * kit's `ThumbnailTreatment`, declared here so the data layer does not import UI code.
 * Captions are about the card's topic, never words put in the pictured person's mouth.
 */
export interface CardImageThumbnail {
  /** 1–3 shouty words (Dutch). */
  caption?: string;
  /** One emoji. */
  sticker?: string;
  /** Red arrow (tip at x/y) or circle (centre at x/y), in percent of the 4:3 frame. */
  marker?: { shape: "arrow" | "circle"; x: number; y: number };
}

/** One picture in `public/cards/`, keyed by a game-content card or event id. */
export interface CardImageManifestEntry {
  /** Card or event id from `@/features/game-content/api`. */
  contentId: string;
  /** File name in `public/cards/` (served at `/cards/<file>`). */
  file: string;
  /** Dutch alt text describing the actual photo (not the illustration hint in game-content). */
  alt: string;
  /** Point to keep in view when the frame crops further, in percent (0–100). */
  focalPoint: { x: number; y: number };
  /** Maker as named in the owner's file name (the Unsplash photographer), "TMI", or "Onbekend". */
  author: string;
  /** Source page of the original upload (Unsplash only). */
  sourceUrl?: string;
  license: CardImageLicense;
  /** Licence page (Unsplash only). */
  licenseUrl?: string;
  /** Set when the same photo serves more than one id (sourcing rule: record every reuse). */
  reusedFrom?: string;
  thumbnail?: CardImageThumbnail;
}

/** What the board passes to the GameCard `image` prop (plus intrinsic size for layout). */
export interface CardImage {
  src: string;
  alt: string;
  focalPoint: { x: number; y: number };
  width: number;
  height: number;
  thumbnail?: CardImageThumbnail;
}

/** One line on the credits screen: one per distinct picture. */
export interface CardImageCredit {
  /** First content id that uses the picture (also the key for its thumbnail). */
  contentId: string;
  /** "Foto: Author, Unsplash License" — the plain-text attribution. */
  text: string;
  author: string;
  sourceUrl?: string;
  license: CardImageLicense;
  licenseUrl?: string;
  /** How many cards and events show this picture (the owner reused some). */
  cardCount: number;
}
