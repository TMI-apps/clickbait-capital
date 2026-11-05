import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api";
import { isSupabaseConfigured } from "@/shared/services/supabaseService";
import { appScrollContentClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

const copy = UI_COPY.privacy;

/**
 * Short privacy note. The error-report line shows only when Supabase is configured, because
 * error reporting sends nothing without it (`errorReportService` `isEnabled`).
 */
export const PrivacyPage = () => (
  <div className={cn(appScrollContentClassName, "pb-8")}>
    <div className="flex w-full max-w-[640px] flex-col gap-4">
      <h1 className="font-heading text-3xl font-bold text-primary">{copy.title}</h1>
      <p>{copy.intro}</p>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
        {isSupabaseConfigured() && <li>{copy.errorReports}</li>}
      </ul>
      <p className="text-sm text-muted-foreground">{copy.clearHint}</p>
      <p className="text-sm text-muted-foreground">
        {copy.creditsHint}{" "}
        <Link to="/credits" className="underline underline-offset-4">
          {copy.creditsLink}
        </Link>
        .
      </p>
      <Button asChild variant="outline" className="self-start">
        <Link to="/">{copy.closeButton}</Link>
      </Button>
    </div>
  </div>
);
