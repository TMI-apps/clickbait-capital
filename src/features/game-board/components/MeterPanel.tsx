import { useMemo } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Coins, Siren, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeterKey } from "@/features/game-engine/api";
import { JUICE_METER_ATTR, MeterJuice } from "@/features/game-juice/api";
import type { MeterAccent, MeterFlash } from "@/features/game-juice/api";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";
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
  /** Where each line lands if the held card is played (share of its goal); drawn dashed. */
  forecast?: Partial<Record<MeterView["key"], number>> | null;
}

/**
 * The score (score-redesign D10, D31): one chart with Gebruikers and Geld racing to their own
 * coloured goal lines, and the two counters side by side laid over its bottom corners on a
 * translucent backing: icon, name, absolute amount and the last change. A reached goal glows and
 * shows a check. Screen readers hear one `role="meter"` per number, with its goal. Phone and desk
 * alike; the desk chart is just taller.
 */
export const MeterPanel = ({
  meters,
  version,
  accents = {},
  flashes = {},
  forecast = null,
}: MeterPanelProps) => {
  // Memoised so a re-render that changes neither (juice, drag moves) doesn't rebuild a long run's path.
  const series = useMemo(
    () =>
      meters.map((tile) => ({
        key: tile.key,
        shares: tile.history,
        tone: METERS[tile.key].text,
        goalText: tile.goalAmountText,
        forecast: forecast?.[tile.key],
      })),
    [meters, forecast]
  );
  return (
    <section className="rounded-lg border border-border bg-card p-1.5 elevation-sm board-desk:p-3">
      <ScoreChart
        series={series}
        markers={meters[0]?.phaseStarts}
        className="h-24 sm:h-28 board-desk:h-56"
      >
        <ul
          aria-label="Gebruikers en geld"
          className="absolute inset-x-0 bottom-0 grid grid-cols-2 items-end gap-2"
        >
          {meters.map((tile, index) => (
            <ScoreCounter
              key={tile.key}
              tile={tile}
              alignEnd={index === meters.length - 1}
              version={version}
              accent={accents[tile.key]}
              flash={flashes[tile.key]}
            />
          ))}
        </ul>
      </ScoreChart>
    </section>
  );
};

interface ScoreCounterProps {
  tile: MeterView;
  /** The right-hand counter aligns to the chart's right edge. */
  alignEnd: boolean;
  version: number;
  accent?: MeterAccent;
  flash?: MeterFlash;
}

/** One counter over the chart: a translucent backing keeps it readable over the lines. */
const ScoreCounter = ({ tile, alignEnd, version, accent, flash }: ScoreCounterProps) => {
  const meter = METERS[tile.key];
  return (
    <li
      {...{ [JUICE_METER_ATTR]: tile.key }}
      className={cn(
        "relative min-w-0 rounded-md bg-card/80 px-1.5 py-0.5 backdrop-blur-[2px]",
        alignEnd && "justify-self-end text-right",
        tile.full && meter.capGlow
      )}
    >
      <MeterJuice accent={accent} flash={flash} version={version} />
      {/* Visual readout; the meter below speaks amount, change and goal once (screen-reader D3). */}
      <div
        aria-hidden="true"
        className={cn(
          "hidden min-w-0 items-center gap-1 text-xs font-semibold sm:flex board-desk:text-sm",
          alignEnd && "justify-end",
          meter.text
        )}
      >
        <meter.icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">{meter.label}</span>
        {tile.full && <Check aria-hidden="true" className="size-3.5 text-success" />}
      </div>
      <div
        aria-hidden="true"
        className={cn("flex flex-wrap items-center gap-x-1", alignEnd && "justify-end")}
      >
        {/* Phones drop the name row so the chart keeps its height; icon and colour still tell the lines apart. */}
        <meter.icon className={cn("size-3.5 shrink-0 sm:hidden", meter.text)} />
        {tile.full && <Check className="size-3.5 text-success sm:hidden" />}
        <span
          className={cn(
            "font-mono text-base leading-tight font-bold whitespace-nowrap tabular-nums sm:text-lg board-desk:text-2xl",
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
};

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
