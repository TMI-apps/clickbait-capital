import { cn } from "@/shared/utils/cn";
import type { CardImageCredit } from "@/features/card-imagery/types/cardImage.types";

export interface ImageCreditListProps {
  credits: readonly CardImageCredit[];
  className?: string;
}

const linkClassName = "underline underline-offset-2 hover:text-primary";

/** Text or, when there is a URL, an outbound link (source page, licence page). */
const OptionalLink = ({ href, children }: { href?: string; children: string }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" className={linkClassName}>
      {children}
    </a>
  ) : (
    <>{children}</>
  );

/** Second line of a credit: where the photo comes from, its licence, and how often it is used. */
const CreditDetails = ({ credit }: { credit: CardImageCredit }) => (
  <span className="text-muted-foreground">
    {credit.sourceUrl && (
      <>
        <OptionalLink href={credit.sourceUrl}>Foto op Unsplash</OptionalLink>
        {" · "}
      </>
    )}
    <OptionalLink href={credit.licenseUrl}>{credit.license}</OptionalLink>
    {credit.cardCount > 1 && ` · op ${credit.cardCount} kaarten`}
  </span>
);

/**
 * Credit list for the card pictures: a small lazy thumbnail, the maker's name, then the source
 * page and licence (linked when they have a page). A reused picture is listed once.
 */
export const ImageCreditList = ({ credits, className }: ImageCreditListProps) => (
  <ul className={cn("flex flex-col gap-3", className)}>
    {credits.map((credit) => (
      <li key={credit.contentId} className="flex items-center gap-3 text-sm">
        <img
          src={credit.src}
          alt=""
          width={64}
          height={48}
          loading="lazy"
          decoding="async"
          className="h-12 w-16 shrink-0 rounded-sm bg-muted object-cover"
        />
        <span className="flex min-w-0 flex-col break-words">
          <span className="font-semibold">{credit.author}</span>
          <CreditDetails credit={credit} />
        </span>
      </li>
    ))}
  </ul>
);
