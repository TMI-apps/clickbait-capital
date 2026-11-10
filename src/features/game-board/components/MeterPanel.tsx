import { AlertTriangle, ArrowDown, ArrowUp, Check, Coins, Siren, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeterKey } from "@/features/game-engine/api";
import { JUICE_METER_ATTR, MeterJuice } from "@/features/game-juice/api";
import type { MeterAccent, MeterFlash } from "@/features/game-juice/api";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";
import { SCORE_HISTORY_POINTS } from "@/features/game-board/types/gameBoard.types";
import { UI_COPY } from "@/features/game-content/api";
import { ScoreChart } from "@/features/score-chart/api";
import { cn } from "@/shared/utils/cn";

/**
 * Tile vocabulary (icon, label, colour). Second copy: the GameCard kit keeps the same set in
 * `src/components/common/GameCard/gameCardVariants.ts` (GAME_CARD_METERS); extract to a shared
 * module when a third consumer appears (code-style § Naming F2).
 */
const METERS: Record<
  MeterView["key"],
  { label: string; icon: LucideIcon; text: string; capGlow: string }
> = {
  revenue: {
    label: UI_COPY.meters.revenue.label,
    icon: Coins,
    text: "text-meter-revenue",
    capGlow: "shadow-[0_0_14px_-2px_var(--meter-revenue)]",
  },
  users: {
    label: UI_COPY.meters.users.label,
    icon: TrendingUp,
    text: "text-meter-users",
    capGlow: "shadow-[0_0_14px_-2px_var(--meter-users)]",
  },
};

const MeterDelta = ({ delta, text }: { delta: number; text: string }) => {
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
      {text}
    </span>
  );
};

export interface MeterPanelProps {
  meters: MeterView[];
  /** Changes on every action so the delta chips and juice animate again. */
  version: number;
  /** Juice of the last action per tile (game-juice): accent mark and gain / loss flash. */
  accents?: Partial<Record<MeterKey, MeterAccent>>;
  flashes?: Partial<Record<MeterKey, MeterFlash>>;
}

/**
 * The score (score-redesign D10): the chart with Gebruikers and Geld racing to the phase's goal
 * line, and under it one readout per number: icon, name, absolute amount, the last change and
 * the goal. A reached goal line glows and shows a check. Screen readers hear one `role="meter"`
 * per number. Phone and desk alike: chart on top, the two readouts side by side.
 */
export const MeterPanel = ({ meters, version, accents = {}, flashes = {} }: MeterPanelProps) => (
  <section className="rounded-lg border border-border bg-card p-2 elevation-sm board-desk:p-4">
    <ScoreChart
      series={meters.map((tile) => ({
        key: tile.key,
        shares: tile.history,
        tone: METERS[tile.key].text,
        goalText: tile.goalAmountText,
      }))}
      slots={SCORE_HISTORY_POINTS}
    />
    <ul
      aria-label="Gebruikers en geld"
      className="mt-1 grid grid-cols-2 gap-2 board-desk:mt-3 board-desk:grid-cols-1 board-desk:gap-3"
    >
      {meters.map((tile) => {
        const meter = METERS[tile.key];
        return (
          <li
            key={tile.key}
            {...{ [JUICE_METER_ATTR]: tile.key }}
            className={cn("relative min-w-0 rounded-md px-1", tile.full && meter.capGlow)}
          >
            <MeterJuice accent={accents[tile.key]} flash={flashes[tile.key]} version={version} />
            {/* Visual readout; the meter below speaks amount, change and goal once (screen-reader D3). */}
            <div
              aria-hidden="true"
              className={cn(
                "flex min-w-0 items-center gap-1 text-xs font-semibold board-desk:text-sm",
                meter.text
              )}
            >
              <meter.icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{meter.label}</span>
              {tile.full && <Check aria-hidden="true" className="size-4 text-success" />}
            </div>
            <div aria-hidden="true" className="flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={cn(
                  "font-mono text-lg font-bold whitespace-nowrap tabular-nums sm:text-2xl board-desk:text-3xl",
                  tile.danger && "text-destructive"
                )}
              >
                {tile.amountText}
              </span>
              <MeterDelta key={version} delta={tile.delta} text={tile.deltaText} />
              {tile.danger && <AlertTriangle className="size-4 text-destructive" />}
            </div>
            <span
              role="meter"
              aria-label={meter.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={tile.value}
              aria-valuetext={tile.valueText}
              className="sr-only"
            />
          </li>
        );
      })}
    </ul>
  </section>
);

/** The scandal warning under the tiles (score-redesign D13): only while reputation is low. */
export const ScandalWarning = ({ text }: { text: string }) => (
  <p
    role="status"
    className="flex items-center gap-1.5 rounded-lg border-2 border-destructive bg-destructive/10 px-2 py-1 text-sm font-bold text-destructive"
  >
    <Siren aria-hidden="true" className="size-4 shrink-0" />
    {text}
  </p>
);
