import { GameCard } from "@/components/common/GameCard";
import { Button } from "@/components/common/Button";
import type { ScoreMockup } from "@/features/score-mockup/hooks/useScoreMockup";
import type { MockCardKind } from "@/features/score-mockup/types/scoreMockup.types";
import { cn } from "@/shared/utils/cn";

/** What a card does to the trend, as the redesigned cards would say it (score-redesign D8). */
const CARD_HINTS: Record<MockCardKind, string> = {
  viral: "Groei ↑↑ · risico ?",
  ad: "€ per gebruiker ↑↑ · groei ↓",
  news: "Reputatie ↑ · groei ↓",
};

const KIND_CHIP: Record<MockCardKind, string> = {
  viral: "bg-type-viral text-type-viral-foreground",
  ad: "bg-type-ad text-type-ad-foreground",
  news: "bg-type-news text-type-news-foreground",
};

const KIND_LABEL: Record<MockCardKind, string> = { viral: "Viraal", ad: "Reclame", news: "Nieuws" };

/** The feed: the last plays, newest on top, each with what it did to the two numbers. */
export const MockFeed = ({ mock, className }: { mock: ScoreMockup; className?: string }) => (
  <section
    aria-label="Feed"
    className={cn(
      "min-h-0 overflow-hidden rounded-xl border border-border bg-muted/40 p-2",
      className
    )}
  >
    {mock.view.feed.length === 0 ? (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Tik een kaart: je ziet meteen wat hij met je groei en geld doet. Tik nog eens (of op
        &ldquo;In de feed&rdquo;) om te spelen. Of druk op <strong>Demo</strong>.
      </p>
    ) : (
      <ol className="flex flex-col gap-1.5">
        {mock.view.feed.map((turn, index) => (
          <li
            key={turn.key}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-card p-2 text-sm elevation-sm",
              index === 0 && "animate-card-draw"
            )}
          >
            {turn.kind && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold uppercase",
                  KIND_CHIP[turn.kind]
                )}
              >
                {KIND_LABEL[turn.kind]}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate font-semibold">{turn.title}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {turn.effectText}
            </span>
          </li>
        ))}
      </ol>
    )}
  </section>
);

/** Three compact cards: tap = select and preview, tap again or the button = play. */
export const MockHand = ({ mock }: { mock: ScoreMockup }) => (
  <section aria-label="Jouw kaarten" className="flex flex-col gap-2">
    <ul className="grid grid-cols-3 gap-2">
      {mock.hand.map((card) => {
        const isSelected = mock.selected?.kind === card.kind;
        return (
          <li key={card.id} className="flex min-w-0 flex-col gap-1">
            <GameCard
              type={card.kind}
              title={card.title}
              size="compact"
              selected={isSelected}
              disabled={mock.demoRunning}
              onSelect={() => (isSelected ? mock.play(card) : mock.select(card))}
              className="animate-card-draw"
            />
            <p className="text-center text-[0.7rem] leading-tight text-muted-foreground">
              {CARD_HINTS[card.kind]}
            </p>
          </li>
        );
      })}
    </ul>
    <Button
      size="lg"
      disabled={!mock.selected || mock.demoRunning}
      onClick={() => mock.selected && mock.play(mock.selected)}
    >
      {mock.selected ? `In de feed: ${mock.selected.title}` : "Kies een kaart"}
    </Button>
  </section>
);
