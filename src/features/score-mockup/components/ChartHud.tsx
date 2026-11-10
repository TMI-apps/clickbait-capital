import { Coins, Siren, Users } from "lucide-react";
import type { ScoreMockup } from "@/features/score-mockup/hooks/useScoreMockup";
import { useTweenedText } from "@/features/score-mockup/hooks/useTweenedNumber";
import type {
  ReputationLevel,
  TickerView,
  TrendView,
} from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";
import { TrendChip } from "./TrendChip";

const W = 200;
const H = 80;
const SLOTS = 14;

function toLine(values: number[], offset: number, top: number): string {
  return values
    .map((value, index) => `${((offset + index) / (SLOTS - 1)) * W},${H - (value / top) * H}`)
    .join(" ");
}

interface ChartProps {
  series: Array<{ ticker: TickerView; tone: string }>;
}

/** Stock-style chart: both numbers as share of their goal, the finish line, and the forecast. */
const RaceChart = ({ series }: ChartProps) => {
  const visibleCount = SLOTS - 3;
  const lines = series.map(({ ticker, tone }) => ({
    tone,
    values: ticker.shares.slice(-visibleCount),
    ahead: ticker.forecastShares,
  }));
  const top =
    Math.max(1.15, ...lines.flatMap((line) => [...line.values, ...(line.ahead ?? [])])) * 1.05;
  const goalY = H - (1 / top) * H;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-28 w-full overflow-visible board-desk:h-56"
    >
      <rect x={0} y={0} width={W} height={goalY} className="fill-success/10" />
      <line
        x1={0}
        x2={W}
        y1={goalY}
        y2={goalY}
        className="stroke-success"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        vectorEffect="non-scaling-stroke"
      />
      {lines.map(({ tone, values, ahead }) => {
        const last = values.length - 1;
        return (
          <g key={tone} className={tone}>
            <polyline
              points={toLine(values, 0, top)}
              fill="none"
              className="stroke-current"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {ahead && (
              <polyline
                points={toLine([values[last]!, ...ahead], last, top)}
                fill="none"
                className="stroke-current opacity-75"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={(last / (SLOTS - 1)) * W}
              cy={H - (values[last]! / top) * H}
              r={3}
              className="fill-current"
            />
          </g>
        );
      })}
    </svg>
  );
};

/** Red (danger) or amber (warning) glow around the whole screen; nothing while safe. */
const DangerVignette = ({ level }: { level: ReputationLevel }) => {
  if (level === "safe") return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-40 transition-shadow duration-(--duration-slow)",
        level === "danger"
          ? "animate-pulse shadow-[inset_0_0_90px_20px_var(--destructive)]"
          : "shadow-[inset_0_0_50px_0_var(--warning)]"
      )}
    />
  );
};

interface LegendProps {
  icon: typeof Users;
  tone: string;
  label: string;
  ticker: TickerView;
  turn: number;
}

const Legend = ({ icon: Icon, tone, label, ticker, turn }: LegendProps) => {
  const text = useTweenedText(ticker.value, ticker.format);
  const chips: Array<[TrendView | null, boolean]> = [
    [ticker.trend, false],
    [ticker.preview, true],
  ];
  return (
    <div className="min-w-0">
      <p className={cn("flex items-center gap-1 text-xs font-bold uppercase", tone)}>
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </p>
      <p className="font-mono text-xl leading-tight font-black tabular-nums board-desk:text-3xl">
        {text}
      </p>
      <div className="flex min-h-6 flex-wrap gap-1">
        {chips.map(([chip, preview]) =>
          chip ? (
            <TrendChip
              key={preview ? "preview" : turn}
              {...chip}
              preview={preview}
              className={preview ? undefined : "animate-juice-pop"}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

/** Variant C: a live stock chart racing both numbers to the goal line; danger glows red. */
export const ChartHud = ({ mock }: { mock: ScoreMockup }) => {
  const { view } = mock;
  const { level } = view;
  return (
    <section
      aria-label="Score"
      className="relative rounded-xl border border-border bg-card p-3 elevation-sm board-desk:p-4"
    >
      <DangerVignette level={level} />
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-success">DOEL fase 2 ↑</span>
        {level !== "safe" && (
          <span
            role="status"
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 font-bold",
              level === "danger"
                ? "bg-destructive text-destructive-foreground"
                : "bg-warning/20 text-warning"
            )}
          >
            <Siren
              aria-hidden="true"
              className={cn("size-3.5", level === "danger" && "animate-bounce")}
            />
            {level === "danger" ? "Toezichthouder komt eraan!" : "Reputatie zakt"}
          </span>
        )}
      </div>
      <RaceChart
        series={[
          { ticker: view.users, tone: "text-meter-users" },
          { ticker: view.money, tone: "text-meter-revenue" },
        ]}
      />
      <div className="mt-2 grid grid-cols-2 gap-2 board-desk:gap-4">
        <Legend
          icon={Users}
          tone="text-meter-users"
          label="Gebruikers"
          ticker={view.users}
          turn={view.turn}
        />
        <Legend
          icon={Coins}
          tone="text-meter-revenue"
          label="Geld"
          ticker={view.money}
          turn={view.turn}
        />
      </div>
    </section>
  );
};
