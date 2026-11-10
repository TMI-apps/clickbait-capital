import { Coins, Flag, Landmark, Siren, Users } from "lucide-react";
import type { ScoreMockup } from "@/features/score-mockup/hooks/useScoreMockup";
import { useTweenedText } from "@/features/score-mockup/hooks/useTweenedNumber";
import type { ReputationLevel } from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";
import { TrendChip } from "./TrendChip";
/** Hazard tape across the HUD top: absent while safe, thin amber in warning, thick red in danger. */
const HazardStripe = ({ level }: { level: ReputationLevel }) => {
  if (level === "safe") return null;
  const danger = level === "danger";
  return (
    <div
      role="status"
      className={cn(
        "-mx-3 -mt-3 mb-2 flex items-center justify-center gap-2 rounded-t-xl font-bold board-desk:-mx-4 board-desk:-mt-4",
        danger
          ? "h-9 bg-[repeating-linear-gradient(135deg,var(--destructive)_0_14px,var(--foreground)_14px_28px)] text-sm"
          : "h-5 bg-[repeating-linear-gradient(135deg,var(--warning)_0_10px,transparent_10px_20px)] text-xs"
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1 rounded px-2",
          danger ? "bg-destructive text-destructive-foreground" : "bg-card text-warning"
        )}
      >
        {danger && <Siren aria-hidden="true" className="size-4 animate-bounce" />}
        {danger ? "SCHANDAAL: waarde zakt!" : "Reputatie zakt"}
      </span>
    </div>
  );
};

interface FactorProps {
  icon: typeof Users;
  tone: string;
  value: string;
  label: string;
  turn: number;
}

const Factor = ({ icon: Icon, tone, value, label, turn }: FactorProps) => (
  <span
    key={turn}
    className="flex min-w-0 flex-col items-center rounded-lg bg-muted px-1.5 py-1 animate-juice-pop"
  >
    <span
      className={cn(
        "flex items-center gap-1 font-mono text-xs font-black whitespace-nowrap tabular-nums min-[26rem]:text-sm board-desk:text-base",
        tone
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {value}
    </span>
    <span className="text-[0.65rem] leading-tight text-muted-foreground">{label}</span>
  </span>
);

/**
 * Variant B: one score, Bedrijfswaarde, with a Balatro-style breakdown
 * (gebruikers × waarde per gebruiker + geld) and a hazard stripe in the danger zone.
 */
export const ValueHud = ({ mock }: { mock: ScoreMockup }) => {
  const { company, level, turn } = mock.view;
  const shown = useTweenedText(company.value, "money", 1400);
  return (
    <section
      aria-label="Score"
      className="overflow-hidden rounded-xl border border-border bg-card p-3 elevation-sm board-desk:p-4"
    >
      <HazardStripe level={level} />
      <p className="flex items-center gap-1 text-xs font-bold text-primary uppercase">
        <Landmark aria-hidden="true" className="size-4" />
        Bedrijfswaarde
      </p>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p
          className={cn(
            "font-mono text-4xl leading-tight font-black tabular-nums board-desk:text-6xl",
            level === "danger" && "text-destructive"
          )}
        >
          {shown}
        </p>
        {company.change && (
          <TrendChip key={turn} {...company.change} className="animate-juice-pop" />
        )}
        {company.preview && <TrendChip {...company.preview} preview />}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-center">
        <Factor
          icon={Users}
          tone="text-meter-users"
          value={company.usersText}
          label="gebruikers"
          turn={turn}
        />
        <span aria-hidden="true" className="font-black text-muted-foreground">
          ×
        </span>
        <Factor
          icon={Coins}
          tone="text-meter-revenue"
          value={company.perUserText}
          label="per gebruiker"
          turn={turn}
        />
        <span aria-hidden="true" className="font-black text-muted-foreground">
          +
        </span>
        <Factor
          icon={Landmark}
          tone="text-primary"
          value={company.moneyText}
          label="geld"
          turn={turn}
        />
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Flag aria-hidden="true" className="size-3 shrink-0" />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-(--duration-slow)"
            style={{ width: `${company.progress * 100}%` }}
          />
        </div>
        <span className="tabular-nums">{company.goalText}</span>
      </div>
    </section>
  );
};
