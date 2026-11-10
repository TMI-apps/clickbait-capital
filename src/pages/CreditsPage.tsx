import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { AUDIO_CREDIT_LINE } from "@/features/game-audio/api";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
import {
  ImageCreditList,
  listCardImageCredits,
  listPhaseImageCredits,
} from "@/features/card-imagery/api";
import { appScrollContentClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

const copy = UI_COPY.credits;
/** Phase intro photos first (they open the run), then the card and event photos. */
const imageCredits = [...listPhaseImageCredits(), ...listCardImageCredits()];

/** About and credits: what the game is, the disclaimer, and every image and audio credit. */
export const CreditsPage = () => (
  <div className={cn(appScrollContentClassName, "pb-8")}>
    <div className="flex w-full max-w-[640px] flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold text-primary">{copy.title}</h1>
        <p>
          <GlossaryText text={copy.body} glossary={GLOSSARY} />
        </p>
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
        <ImageCreditList credits={imageCredits} />
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
