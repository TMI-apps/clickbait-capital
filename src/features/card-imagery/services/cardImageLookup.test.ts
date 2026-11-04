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
};

describe("card image manifest", () => {
  it("should give every card and event an image when the deck is loaded", () => {
    expect(CONTENT_IDS).toHaveLength(67);
    for (const id of CONTENT_IDS) {
      expect(getCardImage(id), id).not.toBeNull();
    }
  });

  it("should hold one entry per content id when built", () => {
    const ids = CARD_IMAGE_MANIFEST.map((entry) => entry.contentId);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...CONTENT_IDS].sort());
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
