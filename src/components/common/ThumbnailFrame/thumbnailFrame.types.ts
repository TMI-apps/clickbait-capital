/**
 * Public data shape of the ThumbnailFrame kit component: the "video thumbnail" look drawn
 * in code over a photo (presentation only; callers map their own data onto it).
 */

/** Accent colour of the outline and glow; matches the game card type tokens. */
export type ThumbnailAccent = "viral" | "ad" | "news" | "event";

/** Shapes a thumbnail uses to point at something in the photo. */
export type ThumbnailMarkerShape = "arrow" | "circle";

/** A red arrow or circle; `x` / `y` are in percent of the frame (0–100). */
export interface ThumbnailMarker {
  shape: ThumbnailMarkerShape;
  /** For an arrow: where its tip points. For a circle: its centre. */
  x: number;
  y: number;
}

/**
 * Optional parts on top of the always-on colour boost and outline. Keep the caption about
 * the topic (1–3 shouty words), never a quote from the person in the photo.
 */
export interface ThumbnailTreatment {
  /** 1–3 words, shown uppercase in outlined type. */
  caption?: string;
  /** One emoji, shown as a sticker in the top-right corner. */
  sticker?: string;
  marker?: ThumbnailMarker;
}
