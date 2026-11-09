import { AlertTriangle, ArrowDown, ArrowUp, Coins, ShieldCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CapBadge } from "@/components/common/GameCard";
import type { MeterKey } from "@/features/game-engine/api";
import { CountUpNumber, JUICE_METER_ATTR, MeterJuice } from "@/features/game-juice/api";
import type { MeterAccent, MeterFlash } from "@/features/game-juice/api";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";
import { UI_COPY } from "@/features/game-content/api";
import { cn } from "@/shared/utils/cn";

/**
 * Meter vocabulary (icon, label, colour). Second copy: the GameCard kit keeps the same set in
 * `src/components/common/GameCard/gameCardVariants.ts` (GAME_CARD_METERS); extract to a shared
 * module when a third consumer appears (code-style § Naming F2).
 */
const METERS: Record<
  MeterKey,
  { label: string; icon: LucideIcon; text: string; bar: string; capGlow: string }
> = {
  revenue: {
    label: UI_COPY.meters.revenue.label,
    icon: Coins,
    text: "text-meter-revenue",
    bar: "bg-meter-revenue",
    capGlow: "shadow-[0_0_14px_-2px_var(--meter-revenue)]",
  },
  users: {
    label: UI_COPY.meters.users.label,
    icon: TrendingUp,
    text: "text-meter-users",
    bar: "bg-meter-users",
    capGlow: "shadow-[0_0_14px_-2px_var(--meter-users)]",
  },
  reputation: {
    label: UI_COPY.meters.reputation.label,
    icon: ShieldCheck,
    text: "text-meter-reputation",
    bar: "bg-meter-reputation",
    capGlow: "shadow-[0_0_14px_-2px_var(--meter-reputation)]",
  },
};

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
  /** Changes on every action so the delta chips and juice animate again. */
  version: number;
  /** Juice of the last action per meter (game-juice): accent mark and gain / loss flash. */
  accents?: Partial<Record<MeterKey, MeterAccent>>;
  flashes?: Partial<Record<MeterKey, MeterFlash>>;
  /** Count the numbers to their new value; false snaps them (news stays dull). */
  countUp?: boolean;
}

/**
 * The three platform meters: icon, name, a counting value 0–100, change and an animated bar.
 * A full meter glows and says "MAX" so wasted gains are visible. Screen readers hear one
 * `role="meter"` per tile. A row of three on phones; on the desktop board (`board-desk`) a
 * stack of larger tiles in the status panel (desktop-layout D1).
 */
export const MeterPanel = ({
  meters,
  version,
  accents = {},
  flashes = {},
  countUp = true,
}: MeterPanelProps) => (
  <ul
    aria-label="Meters"
    className="grid grid-cols-3 gap-2 board-desk:grid-cols-1 board-desk:gap-3"
  >
    {meters.map(({ key, value, delta, full, danger, valueText }) => {
      const meter = METERS[key];
      return (
        <li
          key={key}
          {...{ [JUICE_METER_ATTR]: key }}
          className={cn(
            "relative min-w-0 rounded-lg border border-border bg-card p-2 elevation-sm board-desk:p-4",
            full && meter.capGlow
          )}
        >
          <MeterJuice accent={accents[key]} flash={flashes[key]} version={version} />
          {/* Visual readout; the meter below speaks label, value, change and state once (screen-reader D3). */}
          <div
            aria-hidden="true"
            className={cn(
              "flex min-w-0 items-center gap-1 text-xs font-semibold board-desk:gap-1.5 board-desk:text-sm",
              meter.text
            )}
          >
            <meter.icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{meter.label}</span>
            {full && <CapBadge className="ml-auto" />}
          </div>
          <div aria-hidden="true" className="flex items-baseline gap-1.5">
            <CountUpNumber
              value={value}
              instant={!countUp}
              className={cn(
                "font-mono text-xl font-bold tabular-nums sm:text-2xl board-desk:text-4xl",
                danger && "text-destructive"
              )}
            />
            <MeterDelta key={version} delta={delta} />
            {danger && <AlertTriangle className="ml-auto size-4 text-destructive" />}
          </div>
          <div
            role="meter"
            aria-label={meter.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-valuetext={valueText}
            className="mt-1 h-2 overflow-hidden rounded-full bg-muted board-desk:mt-2 board-desk:h-3"
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
