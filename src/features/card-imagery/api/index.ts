/**
 * Public API of the card-imagery feature: pictures for cards and events by content id, the phase intro photos by phase, and
 * the attribution their open licenses require. Import only from here
 * (`@/features/card-imagery/api`), e.g. `<GameCard image={getCardImage(card.id) ?? undefined} />`.
 */
export { ImageCreditList } from "@/features/card-imagery/components/ImageCreditList";
export type { ImageCreditListProps } from "@/features/card-imagery/components/ImageCreditList";
export {
  CARD_IMAGE_HEIGHT,
  CARD_IMAGE_WIDTH,
  formatCardImageCredit,
  getCardImage,
  listCardImageCredits,
} from "@/features/card-imagery/services/cardImageLookup";
export {
  getPhaseImage,
  listPhaseImageCredits,
  PHASE_IMAGE_HEIGHT,
  PHASE_IMAGE_WIDTH,
} from "@/features/card-imagery/services/phaseImageLookup";
export { PHASE_IMAGE_MANIFEST } from "@/features/card-imagery/services/phaseImageManifest";
export { CARD_IMAGE_MANIFEST } from "@/features/card-imagery/services/cardImageManifest";
export type * from "@/features/card-imagery/types/cardImage.types";
