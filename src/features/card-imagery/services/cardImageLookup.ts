import type {
  CardImage,
  CardImageCredit,
  CardImageManifestEntry,
} from "@/features/card-imagery/types/cardImage.types";
import { CARD_IMAGE_MANIFEST } from "@/features/card-imagery/services/cardImageManifest";

/** Every file in `public/cards/` is a 4:3 master of this size (README § Files). */
export const CARD_IMAGE_WIDTH = 640;
export const CARD_IMAGE_HEIGHT = 480;

const ENTRIES_BY_ID = new Map<string, CardImageManifestEntry>(
  CARD_IMAGE_MANIFEST.map((entry) => [entry.contentId, entry])
);

/**
 * Picture for a card or event id, shaped for the GameCard `image` prop (plus intrinsic size),
 * or null when the id has none, so the card shows its type-icon fallback.
 */
export function getCardImage(contentId: string): CardImage | null {
  const entry = ENTRIES_BY_ID.get(contentId);
  if (!entry) return null;
  return {
    src: `/cards/${entry.file}`,
    alt: entry.alt,
    focalPoint: entry.focalPoint,
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    thumbnail: entry.thumbnail,
  };
}

/** Dutch attribution line in TASL order (title, author, license); the source is the link. */
export function formatCardImageCredit(entry: CardImageManifestEntry): string {
  return `“${entry.title}” door ${entry.author}, ${entry.license}`;
}

/**
 * One credit per distinct photo, in manifest order. A photo reused for several ids
 * (`reusedFrom`) is credited once.
 */
export function listCardImageCredits(): CardImageCredit[] {
  return CARD_IMAGE_MANIFEST.filter((entry) => entry.reusedFrom === undefined).map((entry) => ({
    contentId: entry.contentId,
    text: formatCardImageCredit(entry),
    title: entry.title,
    author: entry.author,
    sourceUrl: entry.sourceUrl,
    license: entry.license,
    licenseUrl: entry.licenseUrl,
  }));
}
