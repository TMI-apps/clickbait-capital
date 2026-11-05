import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { useAuthContext } from "@/shared/context/AuthContext";
import { useAuthCallbackHandler } from "@/features/auth/hooks/useAuthCallbackHandler";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { UI_COPY } from "@/features/game-content/api";
import { readSavedRun, type RunStartState } from "@/features/game-save/api";
import { appScrollContentClassName, formContentWidthClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

const RESUME_STATE: RunStartState = { run: "resume" };
const NEW_GAME_STATE: RunStartState = { run: "new" };

const START_LINKS = [
  { to: "/hoe-speel-je", label: UI_COPY.start.howToPlayButton },
  { to: "/instellingen", label: UI_COPY.start.settingsButton },
  { to: "/credits", label: UI_COPY.start.creditsButton },
];

/**
 * Start screen of the game. Sign-in lives on the unlinked `/login` page until accounts are
 * needed; the OAuth return still lands here, so the callback handler and auth error stay.
 * With a saved run it offers "Verder spelen" next to "Nieuw spel" and passes the choice to
 * `/spel`, which then doesn't ask again (local-save D4).
 */
export const HomePage = () => {
  const { loading, error, clearAuthError } = useAuthContext();
  const { isProcessing } = useAuthCallbackHandler();
  const [hasSavedRun] = useState(() => readSavedRun() !== null);

  if (loading || isProcessing) {
    return <PageLoadingState message="Bezig met inloggen…" />;
  }

  return (
    <div className={cn(appScrollContentClassName, "justify-center text-center")}>
      {error && (
        <Alert
          variant="destructive"
          className={cn(formContentWidthClassName, "mb-2 sm:mb-3")}
          action={
            <Button variant="ghost" size="sm" className="-my-1.5 h-8" onClick={clearAuthError}>
              Sluiten
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <div className={cn(formContentWidthClassName, "flex flex-col items-center gap-4")}>
        <h1 className="font-heading text-4xl font-bold text-primary">Clickbait Capital</h1>
        <p className="text-muted-foreground">
          Jij bent het algoritme. Kies elke beurt welke post in de feed komt en laat je platform
          groeien van studentenapp tot beursgenoteerde techreus.
        </p>
        {hasSavedRun ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" asChild>
              <Link to="/spel" state={RESUME_STATE}>
                {UI_COPY.start.continueButton}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/spel" state={NEW_GAME_STATE}>
                {UI_COPY.start.newGameButton}
              </Link>
            </Button>
          </div>
        ) : (
          <Button size="lg" asChild>
            <Link to="/spel">{UI_COPY.start.startButton}</Link>
          </Button>
        )}
        <nav aria-label="Menu" className="flex flex-wrap justify-center gap-2">
          {START_LINKS.map((link) => (
            <Button key={link.to} variant="ghost" className="min-h-11" asChild>
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <footer>
          <Link
            to="/privacy"
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            {UI_COPY.start.privacyLink}
          </Link>
        </footer>
      </div>
    </div>
  );
};
