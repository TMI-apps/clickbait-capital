import { useMemo } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Coins, Siren, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import type { MeterView, ScoreMarkerView } from "@/features/game-board/types/gameBoard.types";
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
  /** Changes on every action so the delta chips animate again. */
  version: number;
  /** Where each line lands if the held card is played (share of its goal); drawn dashed. */
  forecast?: Partial<Record<MeterView["key"], number>> | null;
  /** The held card's change per line as text ("+15.000"), shown at the forecast dot. */
  forecastText?: Partial<Record<MeterView["key"], string>> | null;
  /** Phase starts and events on the chart's time axis (chart-timeline D3). */
  markers?: ScoreMarkerView[];
}

/**
 * The score (score-redesign D10, D31): one chart with Gebruikers and Geld racing to their own
 * coloured goal lines over the whole run, and the two counters laid over its top corners on a
 * translucent backing, so the plot uses the full panel from zero in its bottom-left corner (chart-timeline D6, chart-origin D2): icon, name, absolute amount and the last change. A reached goal glows and
 * shows a check. Screen readers hear one `role="meter"` per number, with its goal. Phone and desk
 * alike; on desk the panel grows to fill the status column (desk-wide D1).
 */
export const MeterPanel = ({
  meters,
  version,
  forecast = null,
  forecastText = null,
  markers,
}: MeterPanelProps) => {
  const chartAnchor = useJuiceAnchor("chart");
  // Memoised so a re-render that changes neither (juice, drag moves) doesn't rebuild a long run's path.
  const series = useMemo(
    () =>
      meters.map((tile) => ({
        key: tile.key,
        shares: tile.history,
        tone: METERS[tile.key].text,
        goalText: tile.goalAmountText,
        forecast: forecast?.[tile.key],
        forecastText: forecastText?.[tile.key],
      })),
    [meters, forecast, forecastText]
  );
  return (
    // No padding on the panel: the plot reaches its inner edges, so the launch origin sits in the
    // panel's bottom-left corner (chart-origin D2). The counters keep the inset instead.
    <section
      ref={chartAnchor}
      className="overflow-hidden rounded-lg border border-border bg-card elevation-sm board-desk:flex board-desk:min-h-0 board-desk:flex-1 board-desk:flex-col"
    >
      <ScoreChart
        series={series}
        markers={markers}
        className="h-31 sm:h-35 board-desk:h-auto board-desk:min-h-0 board-desk:flex-1"
      >
        <ul
          aria-label="Gebruikers en geld"
          className="grid grid-cols-2 items-start gap-2 px-1.5 pt-1.5 board-desk:px-3 board-desk:pt-3"
        >
          {meters.map((tile, index) => (
            <ScoreCounter
              key={tile.key}
              tile={tile}
              alignEnd={index === meters.length - 1}
              version={version}
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
}

/**
 * One counter over the chart: a translucent backing keeps it readable over the lines. It is the
 * juice anchor `meter:<key>` (flash, glow and mark of `card.played` / `meter.changed`).
 */
const ScoreCounter = ({ tile, alignEnd, version }: ScoreCounterProps) => {
  const meter = METERS[tile.key];
  const anchor = useJuiceAnchor(`meter:${tile.key}`);
  return (
    <li
      ref={anchor}
      className={cn(
        "relative min-w-0 rounded-md bg-card/80 px-1.5 py-0.5 backdrop-blur-[2px]",
        // On desk the chart is wide: each counter hugs its content, so its juice glow does too.
        alignEnd ? "justify-self-end text-right" : "board-desk:justify-self-start",
        tile.full && meter.capGlow
      )}
    >
      {/* Visual readout; the meter below speaks amount, change and goal once (screen-reader D3). */}
      <div
        aria-hidden="true"
        className={cn(
          "hidden min-w-0 items-center gap-1 text-xs font-semibold board-desk:flex board-desk:text-sm",
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
        {/* Below the desk layout the name row is dropped so the counters cover little of the chart; icon and colour still tell the lines apart. */}
        <meter.icon className={cn("size-3.5 shrink-0 board-desk:hidden", meter.text)} />
        {tile.full && <Check className="size-3.5 text-success board-desk:hidden" />}
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

/**
 * The scandal warning under the tiles (score-redesign D13): only while reputation is low. It is
 * the juice anchor `scandal` (the warning's ramp in juice-core lap 3).
 */
export const ScandalWarning = ({ text }: { text: string }) => {
  const anchor = useJuiceAnchor("scandal");
  return (
    <p
      ref={anchor}
      role="status"
      className="flex items-center gap-1.5 rounded-lg border-2 border-destructive bg-destructive/10 px-2 py-1 text-sm font-bold text-destructive"
    >
      <Siren aria-hidden="true" className="size-4 shrink-0" />
      {text}
    </p>
  );
};
