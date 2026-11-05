import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { AUDIO_CREDIT_LINE } from "@/features/game-audio/api";
import { UI_COPY } from "@/features/game-content/api";
import { getCardImage, ImageCreditList, listCardImageCredits } from "@/features/card-imagery/api";
import { appScrollContentClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

const copy = UI_COPY.credits;
const imageCredits = listCardImageCredits();
const thumbnails = new Map(
  imageCredits.flatMap((credit) => {
    const image = getCardImage(credit.contentId);
    return image ? [[credit.contentId, image.src] as const] : [];
  })
);

/** About and credits: what the game is, the disclaimer, and every image and audio credit. */
export const CreditsPage = () => (
  <div className={cn(appScrollContentClassName, "pb-8")}>
    <div className="flex w-full max-w-[640px] flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold text-primary">{copy.title}</h1>
        <p>{copy.body}</p>
        <p className="text-sm text-muted-foreground">{copy.disclaimer}</p>
        <p className="text-sm text-muted-foreground">{copy.madeBy}</p>
        <Link to="/privacy" className="self-start text-sm underline underline-offset-4">
          {copy.privacyLink}
        </Link>
      </header>

      <section aria-labelledby="credits-images" className="flex flex-col gap-3">
        <h2 id="credits-images" className="font-heading text-xl font-semibold">
          {copy.imagesHeading}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.imagesIntro}</p>
        <ImageCreditList credits={imageCredits} thumbnails={thumbnails} />
      </section>

      <section aria-labelledby="credits-audio" className="flex flex-col gap-3">
        <h2 id="credits-audio" className="font-heading text-xl font-semibold">
          {copy.audioHeading}
        </h2>
        <p className="text-sm">{AUDIO_CREDIT_LINE}</p>
      </section>

      <Button asChild variant="outline" className="self-start">
        <Link to="/">{copy.closeButton}</Link>
      </Button>
    </div>
  </div>
);
