import { ShieldAlert, ShieldCheck, Siren } from "lucide-react";
import type { ReputationLevel } from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";

export interface ReputationGuardProps {
  level: ReputationLevel;
  reputation: number;
  className?: string;
}

const COPY: Record<ReputationLevel, string> = {
  safe: "Reputatie: rustig",
  warning: "Reputatie zakt. Pas op voor een schandaal!",
  danger: "Schandaal! Gebruikers vluchten en adverteerders stoppen.",
};

/**
 * Variant A's reputation: a tiny calm shield while safe, an amber pulse in warning, a loud red
 * banner with the remaining reputation in the danger zone (score-redesign D3).
 */
export const ReputationGuard = ({ level, reputation, className }: ReputationGuardProps) => {
  if (level === "safe") {
    return (
      <p className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <ShieldCheck aria-hidden="true" className="size-3.5 text-meter-reputation" />
        {COPY.safe}
      </p>
    );
  }
  const danger = level === "danger";
  const Icon = danger ? Siren : ShieldAlert;
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-sm font-bold animate-in fade-in-0 zoom-in-95",
        danger
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "animate-pulse border-warning bg-warning/15 text-warning",
        className
      )}
    >
      <Icon aria-hidden="true" className={cn("size-5 shrink-0", danger && "animate-bounce")} />
      <span className="min-w-0 flex-1 leading-tight">{COPY[level]}</span>
      {danger && (
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <span className="h-2 w-12 overflow-hidden rounded-full bg-destructive-foreground/30">
            <span
              className="block h-full rounded-full bg-destructive-foreground"
              style={{ width: `${(reputation / 40) * 100}%` }}
            />
          </span>
        </span>
      )}
    </div>
  );
};
