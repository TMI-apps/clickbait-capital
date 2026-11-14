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

/** Dutch attribution line: maker, then licence or origin; the source page is the link. */
export function formatCardImageCredit(
  entry: Pick<CardImageManifestEntry, "author" | "license">
): string {
  return `Foto: ${entry.author}, ${entry.license}`;
}

/** Photo sites the manifest links to, by host, named the way the credit line shows them. */
const SOURCE_SITES: Record<string, string> = {
  "unsplash.com": "Unsplash",
  "www.flickr.com": "Flickr",
  "stocksnap.io": "StockSnap",
};

/**
 * Link text for a picture's source page ("Foto op Flickr"), or undefined when there is none.
 * An unknown host still gets a link, labelled with the host itself.
 */
export function formatImageSourceLabel(sourceUrl: string | undefined): string | undefined {
  if (!sourceUrl) return undefined;
  const host = new URL(sourceUrl).hostname;
  return `Foto op ${SOURCE_SITES[host] ?? host}`;
}

/**
 * One credit per distinct picture, in manifest order. A picture reused for several ids
 * (`reusedFrom`) is credited once, with the number of cards that show it.
 */
export function listCardImageCredits(): CardImageCredit[] {
  const counts = new Map<string, number>();
  for (const entry of CARD_IMAGE_MANIFEST) {
    const key = entry.reusedFrom ?? entry.contentId;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return CARD_IMAGE_MANIFEST.filter((entry) => entry.reusedFrom === undefined).map((entry) => ({
    contentId: entry.contentId,
    src: `/cards/${entry.file}`,
    text: formatCardImageCredit(entry),
    author: entry.author,
    sourceUrl: entry.sourceUrl,
    sourceLabel: formatImageSourceLabel(entry.sourceUrl),
    license: entry.license,
    licenseUrl: entry.licenseUrl,
    cardCount: counts.get(entry.contentId) ?? 1,
  }));
}
