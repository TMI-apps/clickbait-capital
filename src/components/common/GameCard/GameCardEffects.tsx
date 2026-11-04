import { cn } from "@/shared/utils/cn";
import type { GameCardEffect } from "./gameCard.types";
import { GAME_CARD_METERS, deltaDirection } from "./gameCardVariants";

/** Greyed "MAX" mark: the rest of this gain is wasted at the meter's cap. */
const CapMark = ({ overflow }: { overflow: number }) => (
  <span className="ml-0.5 rounded-sm bg-muted px-1 font-sans text-[0.625rem] leading-4 font-bold tracking-wide text-muted-foreground">
    <span aria-hidden="true">MAX</span>
    <span className="sr-only">, {overflow} verspild boven het maximum</span>
  </span>
);

export interface GameCardEffectsProps {
  effects: GameCardEffect[];
  id?: string;
  /** Meter icon + number only; the meter name is screen-reader text. */
  compact?: boolean;
}

/**
 * Meter effects as rows: meter icon + name, then arrow + signed number, and a "MAX" mark when
 * part of a gain is lost at the meter's cap. Direction is carried by the arrow, the sign and a
 * spoken word, so colour is never the only signal.
 */
export const GameCardEffects = ({ effects, id, compact = false }: GameCardEffectsProps) => (
  <span id={id} role="list" aria-label="Effecten" className="flex flex-col gap-1">
    {effects.map(({ meter, delta, overflow = 0 }) => {
      const m = GAME_CARD_METERS[meter];
      const d = deltaDirection(delta);
      return (
        <span
          key={meter}
          role="listitem"
          className={cn(
            "flex items-center justify-between",
            compact ? "gap-1 text-xs" : "gap-2 text-sm"
          )}
        >
          <span className={cn("flex min-w-0 items-center gap-1.5 font-medium", m.text)}>
            <m.icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={compact ? "sr-only" : "truncate"}>{m.label}</span>
          </span>
          <span
            className={cn(
              "flex shrink-0 items-center gap-0.5 font-mono font-semibold tabular-nums",
              d.text
            )}
          >
            <d.icon aria-hidden="true" className="size-4" />
            <span aria-hidden="true">
              {d.sign}
              {Math.abs(delta)}
            </span>
            <span className="sr-only">
              {d.spoken} {Math.abs(delta)}
            </span>
            {overflow > 0 && <CapMark overflow={overflow} />}
          </span>
        </span>
      );
    })}
  </span>
);
