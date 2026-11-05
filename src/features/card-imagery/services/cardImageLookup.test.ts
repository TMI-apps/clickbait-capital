import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_CONTENT } from "@/features/game-content/api";
import { CARD_IMAGE_MANIFEST } from "@/features/card-imagery/services/cardImageManifest";
import {
  CARD_IMAGE_HEIGHT,
  CARD_IMAGE_WIDTH,
  formatCardImageCredit,
  getCardImage,
  listCardImageCredits,
} from "@/features/card-imagery/services/cardImageLookup";

const CONTENT_IDS = [
  ...GAME_CONTENT.cards.map((card) => card.id),
  ...GAME_CONTENT.events.map((event) => event.id),
];
const PUBLIC_DIR = resolve(process.cwd(), "public");
const LICENSE_URLS: Record<string, string> = {
  "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "Unsplash License": "https://unsplash.com/license",
};

/**
 * Cards still without a photo (GameCard shows the type-icon placeholder): new kids-content cards
 * no owner photo or vetted fallback fits yet (thumbnail-imagery lap). Shrink this list as photos land.
 */
const PLACEHOLDER_IDS = [
  "ad-fatbikewinkel",
  "ad-snoepwinkel",
  "ad-puistjescreme",
  "ad-merch-drop",
  "news-nep-giveaway-uitleg",
  "news-fatbike-regels",
  "news-ai-plaatje-check",
  "news-kinderbrief",
  "news-schoolkrant",
  "news-klassenapp-tips",
  "news-lootbox-onderzoek",
  "news-reclame-herkennen",
  "news-challenge-waarschuwing",
  "news-nepvolgers-onderzoek",
  "news-kinderen-mening",
  "event-gemeen-filmpje",
  "event-gevaarlijke-challenge",
  "event-skins-oplichting",
  "event-ouders-alarm",
  "event-nepvolgers",
];

/** News cards stay plain (thumbnail-imagery D7): no thumbnail data at all. */
const NEWS_IDS = new Set(
  GAME_CONTENT.cards.filter((card) => card.type === "news").map((card) => card.id)
);

/** First-person words: a caption must never put words in the pictured person's mouth (D5). */
const FIRST_PERSON = /\b(ik|mij|mijn|me|we|wij|ons|onze)\b/i;

describe("card image manifest", () => {
  it("should map every photo to a card or event in the deck when the manifest is built", () => {
    const ids = CARD_IMAGE_MANIFEST.map((entry) => entry.contentId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !CONTENT_IDS.includes(id))).toEqual([]);
  });

  it("should leave only the listed cards without a photo when the deck is loaded", () => {
    const withoutPhoto = CONTENT_IDS.filter((id) => getCardImage(id) === null);
    expect(withoutPhoto.sort()).toEqual([...PLACEHOLDER_IDS].sort());
  });

  it("should point at a small file in public/cards when an entry is listed", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      const path = resolve(PUBLIC_DIR, "cards", entry.file);
      expect(existsSync(path), entry.file).toBe(true);
      expect(statSync(path).size, entry.file).toBeLessThan(150_000);
    }
  });

  it("should carry full attribution under an allowed license when an entry is listed", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      expect(LICENSE_URLS[entry.license], entry.contentId).toBe(entry.licenseUrl);
      expect(entry.author, entry.contentId).not.toBe("");
      expect(entry.title, entry.contentId).not.toBe("");
      expect(entry.alt.length, entry.contentId).toBeGreaterThan(10);
      expect(entry.sourceUrl, entry.contentId).toMatch(/^https:\/\//);
    }
  });
});

describe("card thumbnails", () => {
  it("should give every clickbait entry a short 1–3 word caption when built", () => {
    for (const entry of CARD_IMAGE_MANIFEST.filter((item) => !NEWS_IDS.has(item.contentId))) {
      const caption = entry.thumbnail?.caption ?? "";
      const words = caption.split(/\s+/).filter(Boolean);
      expect(words.length, entry.contentId).toBeGreaterThanOrEqual(1);
      expect(words.length, entry.contentId).toBeLessThanOrEqual(3);
      expect(caption.length, entry.contentId).toBeLessThanOrEqual(18);
      // Longer words run past the card edge on a compact card at 390px.
      for (const word of words)
        expect(word.length, `${entry.contentId}: ${word}`).toBeLessThanOrEqual(9);
    }
  });

  it("should carry no thumbnail data when the card is news", () => {
    for (const entry of CARD_IMAGE_MANIFEST.filter((item) => NEWS_IDS.has(item.contentId))) {
      expect(entry.thumbnail, entry.contentId).toBeUndefined();
    }
  });

  it("should keep captions about the topic when a person is pictured", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      const caption = entry.thumbnail?.caption ?? "";
      expect(caption, entry.contentId).not.toMatch(FIRST_PERSON);
      expect(caption, entry.contentId).not.toMatch(/["“”‘’']/);
    }
  });

  it("should place markers inside the frame when an entry has one", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      const marker = entry.thumbnail?.marker;
      if (!marker) continue;
      for (const value of [marker.x, marker.y]) {
        expect(value, entry.contentId).toBeGreaterThanOrEqual(0);
        expect(value, entry.contentId).toBeLessThanOrEqual(100);
      }
    }
  });

  it("should pass the thumbnail through when the board asks for an image", () => {
    const entry = CARD_IMAGE_MANIFEST.find((item) => item.thumbnail !== undefined);
    expect(entry).toBeDefined();
    if (entry) expect(getCardImage(entry.contentId)?.thumbnail).toEqual(entry.thumbnail);
  });
});

describe("getCardImage", () => {
  it("should return the GameCard image shape when the id is known", () => {
    const image = getCardImage("viral-kat-komkommer");
    expect(image).toMatchObject({
      src: "/cards/viral-kat-komkommer.webp",
      width: CARD_IMAGE_WIDTH,
      height: CARD_IMAGE_HEIGHT,
    });
    expect(image?.alt).not.toBe("");
  });

  it("should return null when the id is unknown", () => {
    expect(getCardImage("no-such-card")).toBeNull();
  });
});

describe("listCardImageCredits", () => {
  it("should credit each distinct photo once when listing", () => {
    const credits = listCardImageCredits();
    const distinct = CARD_IMAGE_MANIFEST.filter((entry) => entry.reusedFrom === undefined);
    expect(credits).toHaveLength(distinct.length);
  });

  it("should format title, author and license when building the credit line", () => {
    const entry = CARD_IMAGE_MANIFEST[0];
    expect(formatCardImageCredit(entry)).toBe(
      `“${entry.title}” door ${entry.author}, ${entry.license}`
    );
  });
});
