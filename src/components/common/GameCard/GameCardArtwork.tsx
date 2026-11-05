import { useState } from "react";
import { ThumbnailFrame } from "@/components/common/ThumbnailFrame";
import { cn } from "@/shared/utils/cn";
import type { GameCardImage, GameCardType } from "./gameCard.types";
import { GAME_CARD_TYPES } from "./gameCardVariants";

export interface GameCardArtworkProps {
  type: GameCardType;
  image?: GameCardImage;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

/** CSS object-position for a focal point in percent; centre when none is given. */
const objectPositionOf = (focalPoint: GameCardImage["focalPoint"]): string =>
  `${clampPercent(focalPoint?.x ?? 50)}% ${clampPercent(focalPoint?.y ?? 50)}%`;

const ArtworkFallback = ({ type, alt }: { type: GameCardType; alt?: string }) => {
  const { icon: TypeIcon, fallback } = GAME_CARD_TYPES[type];
  return (
    <span
      data-slot="game-card-fallback"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={cn("flex size-full items-center justify-center", fallback)}
    >
      <TypeIcon aria-hidden="true" className="size-1/3" strokeWidth={1.5} />
    </span>
  );
};

/**
 * Fixed-ratio image area (token --game-card-image-aspect). Any source shape (portrait,
 * landscape, square) is cropped with object-fit: cover around its focal point and drawn in
 * a ThumbnailFrame (type-coloured outline, optional caption / sticker / marker); a missing
 * or broken image falls back to the type icon on a tinted panel, without the frame.
 */
export const GameCardArtwork = ({ type, image }: GameCardArtworkProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = image !== undefined && image.src !== "" && failedSrc !== image.src;

  return (
    <span className="relative block aspect-game-card-image w-full overflow-hidden bg-muted">
      {showImage ? (
        <ThumbnailFrame accent={type} treatment={image.thumbnail}>
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setFailedSrc(image.src)}
            className="block size-full object-cover"
            style={{ objectPosition: objectPositionOf(image.focalPoint) }}
          />
        </ThumbnailFrame>
      ) : (
        <ArtworkFallback type={type} alt={image?.alt} />
      )}
    </span>
  );
};
