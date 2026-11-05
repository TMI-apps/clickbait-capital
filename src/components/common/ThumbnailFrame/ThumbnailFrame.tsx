import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import type { ThumbnailAccent, ThumbnailMarker, ThumbnailTreatment } from "./thumbnailFrame.types";

export interface ThumbnailFrameProps {
  accent: ThumbnailAccent;
  treatment?: ThumbnailTreatment;
  /** The photo (an `<img>` that fills the frame); it keeps its own alt text. */
  children: ReactNode;
  className?: string;
}

/** Soft inner glow in the accent colour (tokens: card-type colours); the card frame is the outline. */
const ACCENT_GLOW: Record<ThumbnailAccent, string> = {
  viral: "shadow-[inset_0_0_22px_2px_var(--color-type-viral)]",
  ad: "shadow-[inset_0_0_22px_2px_var(--color-type-ad)]",
  news: "shadow-[inset_0_0_22px_2px_var(--color-type-news)]",
  event: "shadow-[inset_0_0_22px_2px_var(--color-type-event)]",
};

/** Eight-way ink outline + drop, so the caption reads on any photo (no -webkit-text-stroke). */
const CAPTION_OUTLINE: CSSProperties = {
  textShadow: [
    "-0.07em -0.07em 0",
    "0.07em -0.07em 0",
    "-0.07em 0.07em 0",
    "0.07em 0.07em 0",
    "0 -0.09em 0",
    "0 0.09em 0",
    "-0.09em 0 0",
    "0.09em 0 0",
    "0.05em 0.14em 0.08em",
  ]
    .map((offset) => `${offset} var(--color-thumbnail-ink)`)
    .join(", "),
};

/** The frame is 4:3; the overlay SVG uses a 100 × 75 user space so shapes keep their form. */
const VIEW_HEIGHT = 75;
const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

/** Arrow body pointing along +x with its tip at the origin. */
const ARROW_POINTS = "0,0 -13,-10 -13,-4.5 -30,-4.5 -30,4.5 -13,4.5 -13,10";

/** Arrow comes in from the photo's centre side, tilted up or down toward its tip. */
const arrowAngle = (x: number, y: number): number => {
  const upper = y < 50;
  if (x >= 50) return upper ? -25 : 25;
  return upper ? 205 : 155;
};

const MarkerShape = ({ marker }: { marker: ThumbnailMarker }) => {
  const x = clampPercent(marker.x);
  const y = (clampPercent(marker.y) / 100) * VIEW_HEIGHT;
  if (marker.shape === "circle") {
    return (
      <g data-slot="thumbnail-marker" data-shape="circle" fill="none">
        <ellipse cx={x} cy={y} rx={15} ry={12} className="stroke-thumbnail-paper" strokeWidth={6} />
        <ellipse
          cx={x}
          cy={y}
          rx={15}
          ry={12}
          className="stroke-thumbnail-marker"
          strokeWidth={3.5}
        />
      </g>
    );
  }
  return (
    <polygon
      data-slot="thumbnail-marker"
      data-shape="arrow"
      points={ARROW_POINTS}
      transform={`translate(${x} ${y}) rotate(${arrowAngle(x, y)})`}
      className="fill-thumbnail-marker stroke-thumbnail-paper"
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
};

/**
 * Video-thumbnail look drawn in code over a photo: colour and contrast boost, a soft accent
 * glow fading in from the edges and a vignette, plus optional marker (red arrow or circle),
 * emoji sticker and 1–3 word caption. Sizes follow the frame width (container units), so it
 * reads on a compact card as well as in a dialog. Placement leaves the top strip (type chip)
 * and the bottom-right corner (a caller's action button) free. The overlay is decorative (`aria-hidden`);
 * the photo's alt text is the accessible description. Static: nothing animates.
 */
export const ThumbnailFrame = ({ accent, treatment, children, className }: ThumbnailFrameProps) => (
  <span
    data-slot="thumbnail-frame"
    data-accent={accent}
    className={cn(
      "@container relative block size-full [&_img]:contrast-125 [&_img]:saturate-150",
      className
    )}
  >
    {children}
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute inset-0 bg-radial from-transparent from-55% to-thumbnail-ink/45" />
      <span className={cn("absolute inset-0", ACCENT_GLOW[accent])} />
      {treatment?.marker && (
        <svg
          viewBox={`0 0 100 ${VIEW_HEIGHT}`}
          className="absolute inset-0 size-full overflow-visible drop-shadow-md"
        >
          <MarkerShape marker={treatment.marker} />
        </svg>
      )}
      {treatment?.sticker && (
        <span
          data-slot="thumbnail-sticker"
          className="absolute top-[27%] right-[4%] rotate-12 text-[17cqw] leading-none drop-shadow-lg"
        >
          {treatment.sticker}
        </span>
      )}
      {treatment?.caption && (
        <span
          data-slot="thumbnail-caption"
          className="absolute bottom-[6%] left-[5%] max-w-[64%] -rotate-3 font-heading text-[10.5cqw] leading-[0.95] font-black tracking-tight break-words text-thumbnail-caption uppercase"
          style={CAPTION_OUTLINE}
        >
          {treatment.caption}
        </span>
      )}
    </span>
  </span>
);
