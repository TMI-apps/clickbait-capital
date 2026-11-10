import type { PhaseImageManifestEntry } from "@/features/card-imagery/types/cardImage.types";

const UNSPLASH_LICENSE = {
  license: "Unsplash License",
  licenseUrl: "https://unsplash.com/license",
} as const;

/**
 * One hero photo per phase, in the order the owner gave them (phase-images lap, owner's pictures
 * as supplied: thumbnail-imagery D11). Each is cropped 16:9 from the original to
 * `public/cards/<file>` (README § Phase photos); `focalPoint` is where the subject sits in it.
 */
export const PHASE_IMAGE_MANIFEST: readonly PhaseImageManifestEntry[] = [
  {
    phaseId: 1,
    file: "phase-1-zolderkamer.webp",
    alt: "Een thuiswerkplek op een zolderkamer: een bureau met een groot scherm, een toetsenbord en een koptelefoon, met planten op de plank erboven.",
    focalPoint: { x: 55, y: 40 },
    author: "Faizur Rehman",
    sourceUrl: "https://unsplash.com/photos/xqh-RlfJVx4",
    ...UNSPLASH_LICENSE,
  },
  {
    phaseId: 2,
    file: "phase-2-scale-up.webp",
    alt: "Een klein team in een kantoor met bakstenen muren: één persoon wijst naar een whiteboard vol gele memo's, de anderen kijken mee vanaf de bank met hun laptops.",
    focalPoint: { x: 60, y: 35 },
    author: "Austin Distel",
    sourceUrl: "https://unsplash.com/photos/wD1LRb9OeEo",
    ...UNSPLASH_LICENSE,
  },
  {
    phaseId: 3,
    file: "phase-3-wereldwijd-platform.webp",
    alt: "Een groot open kantoor met lange bureaus vol schermen, mensen die werken en overleggen, en een trap naar een tweede verdieping.",
    focalPoint: { x: 40, y: 45 },
    author: "Proxyclick Visitor Management System",
    sourceUrl: "https://unsplash.com/photos/l90zRbWvCoE",
    ...UNSPLASH_LICENSE,
  },
  {
    phaseId: 4,
    file: "phase-4-beursgang.webp",
    alt: "Glazen wolkenkrabbers van een zakenwijk, van onderen gefotografeerd tegen een lichte lucht.",
    focalPoint: { x: 50, y: 45 },
    author: "Sean Pollock",
    sourceUrl: "https://unsplash.com/photos/PhYq704ffdA",
    ...UNSPLASH_LICENSE,
  },
];
