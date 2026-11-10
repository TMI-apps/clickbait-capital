import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useDangerShake } from "@/features/score-mockup/hooks/useDangerShake";
import { useScoreMockup } from "@/features/score-mockup/hooks/useScoreMockup";
import type { ScoreHudVariant } from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";
import { ChartHud } from "./ChartHud";
import { MockFeed, MockHand } from "./MockFeedAndHand";
import { TickerHud } from "./TickerHud";
import { ValueHud } from "./ValueHud";

const VARIANTS: Array<{ id: ScoreHudVariant; label: string }> = [
  { id: "a", label: "Tickers" },
  { id: "b", label: "Waarde" },
  { id: "c", label: "Grafiek" },
];

const HUDS = { a: TickerHud, b: ValueHud, c: ChartHud } as const;

export interface ScoreMockupProps {
  variant: ScoreHudVariant;
  onVariantChange: (variant: ScoreHudVariant) => void;
}

/**
 * Throwaway prototype of the score redesign (score-redesign lap): one board-like screen on
 * fake data with three HUD variants. Not the game; deleted when the real HUD lands.
 * Phone: toolbar, HUD, feed, hand. Desk: feed and hand left, HUD panel right.
 */
export const ScoreMockup = ({ variant, onVariantChange }: ScoreMockupProps) => {
  const mock = useScoreMockup();
  const shakeRef = useDangerShake<HTMLDivElement>(mock.view.level, mock.view.turn);
  const Hud = HUDS[variant];
  return (
    <div className="mx-auto grid h-dvh w-full max-w-6xl grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-2 overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] board-desk:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] board-desk:grid-rows-[auto_minmax(0,1fr)] board-desk:gap-x-8 board-desk:gap-y-4 board-desk:py-6">
      <nav aria-label="Mockup" className="flex items-center gap-1 board-desk:col-span-2">
        <span className="mr-1 hidden text-xs font-bold text-muted-foreground uppercase sm:inline">
          Mockup score
        </span>
        {VARIANTS.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={id === variant ? "default" : "outline"}
            aria-pressed={id === variant}
            onClick={() => onVariantChange(id)}
            className="px-2"
          >
            {id.toUpperCase()}
            <span className="hidden min-[26rem]:inline">· {label}</span>
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto px-2"
          onClick={mock.runDemo}
          disabled={mock.demoRunning}
        >
          <Play aria-hidden="true" />
          Demo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="px-2"
          aria-label="Opnieuw"
          onClick={mock.reset}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </nav>
      <div
        ref={shakeRef}
        className="flex min-w-0 flex-col gap-1 board-desk:col-start-2 board-desk:row-start-2"
      >
        <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase">Fase 2</span>
          <span className="font-heading text-sm font-bold text-primary">De Scale-Up</span>
          <span className="ml-auto tabular-nums">Beurt {mock.view.turn + 1}</span>
        </p>
        <Hud mock={mock} />
      </div>
      <div className="contents board-desk:col-start-1 board-desk:row-start-2 board-desk:flex board-desk:min-h-0 board-desk:flex-col board-desk:gap-3">
        <MockFeed mock={mock} className={cn("board-desk:flex-1")} />
        <MockHand mock={mock} />
      </div>
    </div>
  );
};
