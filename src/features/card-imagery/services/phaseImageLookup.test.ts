import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE_INTROS } from "@/features/game-content/api";
import { PHASE_IMAGE_MANIFEST } from "@/features/card-imagery/services/phaseImageManifest";
import {
  getPhaseImage,
  listPhaseImageCredits,
  PHASE_IMAGE_HEIGHT,
  PHASE_IMAGE_WIDTH,
} from "@/features/card-imagery/services/phaseImageLookup";

const PHASE_IDS = Object.keys(PHASE_INTROS).map(Number);

describe("phase image manifest", () => {
  it("should give every phase intro one photo when the manifest is built", () => {
    expect(PHASE_IMAGE_MANIFEST.map((entry) => entry.phaseId)).toEqual(PHASE_IDS);
  });

  it("should point at a small file in public/cards when a phase is listed", () => {
    for (const entry of PHASE_IMAGE_MANIFEST) {
      const path = resolve(process.cwd(), "public", "cards", entry.file);
      expect(existsSync(path), entry.file).toBe(true);
      expect(statSync(path).size, entry.file).toBeLessThan(150_000);
    }
  });

  it("should carry the Unsplash credit and a Dutch alt when a phase is listed", () => {
    for (const entry of PHASE_IMAGE_MANIFEST) {
      expect(entry.author, entry.file).not.toBe("");
      expect(entry.sourceUrl, entry.file).toMatch(/^https:\/\/unsplash\.com\/photos\/\S+$/);
      expect(entry.licenseUrl, entry.file).toBe("https://unsplash.com/license");
      expect(entry.alt.length, entry.file).toBeGreaterThan(10);
      for (const value of [entry.focalPoint.x, entry.focalPoint.y]) {
        expect(value, entry.file).toBeGreaterThanOrEqual(0);
        expect(value, entry.file).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("getPhaseImage", () => {
  it("should return the served file and master size when the phase is known", () => {
    expect(getPhaseImage(1)).toMatchObject({
      src: "/cards/phase-1-zolderkamer.webp",
      width: PHASE_IMAGE_WIDTH,
      height: PHASE_IMAGE_HEIGHT,
    });
  });

  it("should return null when the phase is unknown", () => {
    expect(getPhaseImage(9)).toBeNull();
  });
});

describe("listPhaseImageCredits", () => {
  it("should credit each phase photo once with its file when listing", () => {
    const credits = listPhaseImageCredits();
    expect(credits.map((credit) => credit.contentId)).toEqual(PHASE_IDS.map((id) => `phase-${id}`));
    expect(credits[0]).toMatchObject({
      src: "/cards/phase-1-zolderkamer.webp",
      text: "Foto: Faizur Rehman, Unsplash License",
    });
  });
});
