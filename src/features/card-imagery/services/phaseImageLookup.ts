import type {
  CardImageCredit,
  PhaseImage,
  PhaseImageManifestEntry,
} from "@/features/card-imagery/types/cardImage.types";
import { formatCardImageCredit } from "@/features/card-imagery/services/cardImageLookup";
import { PHASE_IMAGE_MANIFEST } from "@/features/card-imagery/services/phaseImageManifest";

/** Every phase photo is a 16:9 master of this size (README § Phase photos). */
export const PHASE_IMAGE_WIDTH = 1200;
export const PHASE_IMAGE_HEIGHT = 675;

const phaseImageSrc = (entry: PhaseImageManifestEntry): string => `/cards/${entry.file}`;

/** Hero photo for a phase intro, or null for a phase without one (the intro then shows no photo). */
export function getPhaseImage(phaseId: number): PhaseImage | null {
  const entry = PHASE_IMAGE_MANIFEST.find((item) => item.phaseId === phaseId);
  if (!entry) return null;
  return {
    src: phaseImageSrc(entry),
    alt: entry.alt,
    focalPoint: entry.focalPoint,
    width: PHASE_IMAGE_WIDTH,
    height: PHASE_IMAGE_HEIGHT,
  };
}

/** One credit per phase photo, in phase order, shaped like the card credits for `/credits`. */
export function listPhaseImageCredits(): CardImageCredit[] {
  return PHASE_IMAGE_MANIFEST.map((entry) => ({
    contentId: `phase-${entry.phaseId}`,
    src: phaseImageSrc(entry),
    text: formatCardImageCredit(entry),
    author: entry.author,
    sourceUrl: entry.sourceUrl,
    license: entry.license,
    licenseUrl: entry.licenseUrl,
    cardCount: 1,
  }));
}
