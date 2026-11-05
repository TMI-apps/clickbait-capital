/**
 * Provenance and display data for the card and event pictures. Every picture is a
 * third-party photo under an open license, so each entry carries what the license asks
 * for (author, source, license link, credit line) next to what the board needs to show it.
 */

/** Licenses the sourcing rules allow (owner: CC0 or CC BY only; no share-alike, no NC). */
export type CardImageLicense = "CC0 1.0" | "CC BY 2.0" | "CC BY 3.0" | "CC BY 4.0";

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
  /** Title of the original work. */
  title: string;
  /** Creator as named on the source page. */
  author: string;
  /** Source page (landing page of the original upload). */
  sourceUrl: string;
  license: CardImageLicense;
  licenseUrl: string;
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

/** One line on the credits screen. */
export interface CardImageCredit {
  contentId: string;
  /** "“Title” door Author, CC BY 2.0" — the attribution the license asks for (TASL). */
  text: string;
  title: string;
  author: string;
  sourceUrl: string;
  license: CardImageLicense;
  licenseUrl: string;
}
