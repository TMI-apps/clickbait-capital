import { AlertTriangle, ArrowDown, ArrowUp, Coins, ShieldCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeterKey } from "@/features/game-engine/api";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";
import { UI_COPY } from "@/features/game-content/api";
import { cn } from "@/shared/utils/cn";

/**
 * Meter vocabulary (icon, label, colour). Second copy: the GameCard kit keeps the same set in
 * `src/components/common/GameCard/gameCardVariants.ts` (GAME_CARD_METERS); extract to a shared
 * module when a third consumer appears (code-style § Naming F2).
 */
const METERS: Record<MeterKey, { label: string; icon: LucideIcon; text: string; bar: string }> = {
  revenue: {
    label: UI_COPY.meters.revenue.label,
    icon: Coins,
    text: "text-meter-revenue",
    bar: "bg-meter-revenue",
  },
  users: {
    label: UI_COPY.meters.users.label,
    icon: TrendingUp,
    text: "text-meter-users",
    bar: "bg-meter-users",
  },
  reputation: {
    label: UI_COPY.meters.reputation.label,
    icon: ShieldCheck,
    text: "text-meter-reputation",
    bar: "bg-meter-reputation",
  },
};

/** At or below this a meter is in danger (game over at 0). */
const DANGER_AT = 20;

const MeterDelta = ({ delta }: { delta: number }) => {
  if (delta === 0) return null;
  const up = delta > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-xs font-semibold tabular-nums animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-slow)",
        up ? "text-success" : "text-destructive"
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {up ? "+" : "−"}
      {Math.abs(delta)}
    </span>
  );
};

export interface MeterPanelProps {
  meters: MeterView[];
  /** Changes on every action so the delta chips animate again. */
  version: number;
}

/** The three platform meters: icon, name, value 0–100, change and an animated bar. */
export const MeterPanel = ({ meters, version }: MeterPanelProps) => (
  <ul aria-label="Meters" className="grid grid-cols-3 gap-2">
    {meters.map(({ key, value, delta }) => {
      const meter = METERS[key];
      const danger = value <= DANGER_AT;
      return (
        <li key={key} className="min-w-0 rounded-lg border border-border bg-card p-2 elevation-sm">
          <div className={cn("flex min-w-0 items-center gap-1 text-xs font-semibold", meter.text)}>
            <meter.icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{meter.label}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-xl font-bold tabular-nums sm:text-2xl",
                danger && "text-destructive"
              )}
            >
              {value}
            </span>
            <MeterDelta key={version} delta={delta} />
            {danger && (
              <AlertTriangle aria-label="Gevaar" className="ml-auto size-4 text-destructive" />
            )}
          </div>
          <div
            role="meter"
            aria-label={meter.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-valuetext={`${value} van 100${danger ? ", gevaarlijk laag" : ""}`}
            className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-(--duration-slow) ease-(--ease-standard)",
                meter.bar
              )}
              style={{ width: `${value}%` }}
            />
          </div>
        </li>
      );
    })}
  </ul>
);
