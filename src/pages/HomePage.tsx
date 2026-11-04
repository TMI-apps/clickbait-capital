import { Link } from "react-router-dom";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { useAuthContext } from "@/shared/context/AuthContext";
import { useAuthCallbackHandler } from "@/features/auth/hooks/useAuthCallbackHandler";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { appScrollContentClassName, formContentWidthClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

/**
 * Start screen of the game. Sign-in lives on the unlinked `/login` page until accounts are
 * needed; the OAuth return still lands here, so the callback handler and auth error stay.
 */
export const HomePage = () => {
  const { loading, error, clearAuthError } = useAuthContext();
  const { isProcessing } = useAuthCallbackHandler();

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
        <Button size="lg" asChild>
          <Link to="/spel">Start spel</Link>
        </Button>
      </div>
    </div>
  );
};
