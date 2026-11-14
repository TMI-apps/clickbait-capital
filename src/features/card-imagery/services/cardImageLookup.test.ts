import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_CONTENT } from "@/features/game-content/api";
import { CARD_IMAGE_MANIFEST } from "@/features/card-imagery/services/cardImageManifest";
import { PHASE_IMAGE_MANIFEST } from "@/features/card-imagery/services/phaseImageManifest";
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
/** Only the Unsplash License has a licence page; owner-supplied pictures carry none. */
const LICENSE_URLS: Record<string, string | undefined> = {
  "Unsplash License": "https://unsplash.com/license",
  "Eigen foto TMI": undefined,
  "AI-beeld van TMI": undefined,
  "Aangeleverd door TMI": undefined,
};

/**
 * Cards still without a photo (GameCard shows the type-icon placeholder): the decision cards and
 * scandals of the decision-cards lap, until the decision-imagery lap adds their pictures
 * (policy-cards § 10).
 */
const PLACEHOLDER_IDS: string[] = [
  "viral-besluit-eindeloos-scrollen",
  "viral-besluit-vlammetjes",
  "viral-besluit-autoplay",
  "viral-besluit-boze-reacties",
  "viral-besluit-nachtmeldingen",
  "viral-besluit-schoonheidsfilters",
  "viral-besluit-vriendensuggesties",
  "viral-besluit-geheime-boost",
  "ad-besluit-kinderreclame",
  "ad-besluit-quizapps",
  "ad-besluit-vinkje-te-koop",
  "ad-besluit-livestream-cadeaus",
  "ad-besluit-reclame-onzeker",
  "ad-besluit-oplichtersreclame",
  "ad-besluit-moderatie-uitbesteden",
  "ad-besluit-stoppen-factcheckers",
  "news-besluit-prive-accounts",
  "news-besluit-factcheckers-houden",
  "news-besluit-pauzeknop",
  "news-besluit-likes-verbergen",
  "news-besluit-moderatoren-betalen",
  "news-besluit-meldknop",
  "news-besluit-onderzoek-delen",
  "news-besluit-elke-taal",
  "event-vlammetjes-paniek",
  "event-klas-slaapt-in",
  "event-filterspiegel",
  "event-europa-ontwerp",
  "event-onbekende-mannen",
  "event-zakgeld-weg",
  "event-nep-met-vinkje",
  "event-moderatoren-alarm",
  "event-geweld-ver-land",
  "event-chatbot-vriendje",
  "event-nieuwe-wet",
  "event-land-verbiedt-app",
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

  it("should give every card and event a photo when the deck is loaded", () => {
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

  it("should carry the maker and an allowed licence when an entry is listed", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      expect(Object.keys(LICENSE_URLS), entry.contentId).toContain(entry.license);
      expect(entry.licenseUrl, entry.contentId).toBe(LICENSE_URLS[entry.license]);
      expect(entry.author, entry.contentId).not.toBe("");
      expect(entry.alt.length, entry.contentId).toBeGreaterThan(10);
    }
  });

  it("should link the Unsplash photo page when the licence is Unsplash", () => {
    for (const entry of CARD_IMAGE_MANIFEST) {
      if (entry.license === "Unsplash License")
        expect(entry.sourceUrl, entry.contentId).toMatch(/^https:\/\/unsplash\.com\/photos\/\S+$/);
      else expect(entry.sourceUrl, entry.contentId).toBeUndefined();
    }
  });

  it("should share one file and one credit when the owner reused a photo", () => {
    for (const entry of CARD_IMAGE_MANIFEST.filter((item) => item.reusedFrom !== undefined)) {
      const original = CARD_IMAGE_MANIFEST.find((item) => item.contentId === entry.reusedFrom);
      expect(original?.reusedFrom, entry.contentId).toBeUndefined();
      expect(entry.file, entry.contentId).toBe(original?.file);
      expect(entry.author, entry.contentId).toBe(original?.author);
    }
  });

  it("should keep no file in public/cards when no card or phase entry uses it", () => {
    const used = new Set(
      [...CARD_IMAGE_MANIFEST, ...PHASE_IMAGE_MANIFEST].map((entry) => entry.file)
    );
    const unused = readdirSync(resolve(PUBLIC_DIR, "cards")).filter((file) => !used.has(file));
    expect(unused).toEqual([]);
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
    expect(credits.reduce((sum, credit) => sum + credit.cardCount, 0)).toBe(
      CARD_IMAGE_MANIFEST.length
    );
  });

  it("should format maker and licence when building the credit line", () => {
    const entry = CARD_IMAGE_MANIFEST[0];
    expect(formatCardImageCredit(entry)).toBe(`Foto: ${entry.author}, ${entry.license}`);
  });
});
