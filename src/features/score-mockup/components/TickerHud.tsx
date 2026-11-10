import { Coins, Flag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ScoreMockup } from "@/features/score-mockup/hooks/useScoreMockup";
import { useTweenedText } from "@/features/score-mockup/hooks/useTweenedNumber";
import type { TickerView } from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";
import { ReputationGuard } from "./ReputationGuard";
import { Sparkline } from "./Sparkline";
import { TrendChip } from "./TrendChip";

interface TickerProps {
  icon: LucideIcon;
  label: string;
  tone: string;
  ticker: TickerView;
  turn: number;
}

/** One big score number with its trend per turn, sparkline, goal line and card preview. */
const Ticker = ({ icon: Icon, label, tone, ticker, turn }: TickerProps) => {
  const text = useTweenedText(ticker.value, ticker.format);
  return (
    <div className="relative min-w-0 rounded-xl border border-border bg-card p-2.5 elevation-sm board-desk:p-4">
      <p className={cn("flex items-center gap-1 text-xs font-bold uppercase", tone)}>
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </p>
      <p className="font-mono text-2xl leading-tight font-black tabular-nums sm:text-3xl board-desk:text-5xl">
        {text}
      </p>
      <div className="flex min-h-6 flex-wrap items-center gap-1">
        {ticker.trend && <TrendChip key={turn} {...ticker.trend} className="animate-juice-pop" />}
        {ticker.preview && <TrendChip {...ticker.preview} preview />}
      </div>
      <Sparkline
        points={ticker.points}
        forecast={ticker.forecast}
        goal={ticker.goal}
        className={cn("mt-1 board-desk:h-14", tone)}
      />
      <p
        className={cn(
          "mt-0.5 flex items-center gap-1 text-xs tabular-nums",
          ticker.reached ? "font-bold text-success" : "text-muted-foreground"
        )}
      >
        <Flag aria-hidden="true" className="size-3" />
        {ticker.reached ? "Doel gehaald!" : ticker.goalText}
      </p>
    </div>
  );
};

/** Variant A: two big tickers (Gebruikers, Geld) and a reputation guard that is loud only in danger. */
export const TickerHud = ({ mock }: { mock: ScoreMockup }) => {
  const { view } = mock;
  return (
    <section
      aria-label="Score"
      className="grid grid-cols-2 gap-2 board-desk:grid-cols-1 board-desk:gap-3"
    >
      <Ticker
        icon={Users}
        label="Gebruikers"
        tone="text-meter-users"
        ticker={view.users}
        turn={view.turn}
      />
      <Ticker
        icon={Coins}
        label="Geld"
        tone="text-meter-revenue"
        ticker={view.money}
        turn={view.turn}
      />
      <ReputationGuard
        level={view.level}
        reputation={view.reputation}
        className="col-span-2 board-desk:col-span-1"
      />
    </section>
  );
};
