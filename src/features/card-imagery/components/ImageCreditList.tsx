import { cn } from "@/shared/utils/cn";
import type { CardImageCredit } from "@/features/card-imagery/types/cardImage.types";

export interface ImageCreditListProps {
  credits: readonly CardImageCredit[];
  /** Thumbnail src per credit (content id → src); a credit without one shows text only. */
  thumbnails?: ReadonlyMap<string, string>;
  className?: string;
}

const linkClassName = "underline underline-offset-2 hover:text-primary";

/**
 * Attribution list for third-party photos: a small lazy thumbnail, then title, author and
 * license, with the title linking to the source page and the license to its deed.
 */
export const ImageCreditList = ({ credits, thumbnails, className }: ImageCreditListProps) => (
  <ul className={cn("flex flex-col gap-3", className)}>
    {credits.map((credit) => {
      const thumbnail = thumbnails?.get(credit.contentId);
      return (
        <li key={credit.contentId} className="flex items-center gap-3 text-sm">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              width={64}
              height={48}
              loading="lazy"
              decoding="async"
              className="h-12 w-16 shrink-0 rounded-sm bg-muted object-cover"
            />
          )}
          <span className="min-w-0 break-words">
            “
            <a href={credit.sourceUrl} target="_blank" rel="noreferrer" className={linkClassName}>
              {credit.title}
            </a>
            ” door {credit.author},{" "}
            <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className={linkClassName}>
              {credit.license}
            </a>
          </span>
        </li>
      );
    })}
  </ul>
);
