import { cn } from "@/shared/utils/cn";
import type { GameCardEffect } from "./gameCard.types";
import { GAME_CARD_METERS, deltaDirection } from "./gameCardVariants";

export interface GameCardEffectsProps {
  effects: GameCardEffect[];
  id?: string;
}

/**
 * Meter effects as rows: meter icon + name, then arrow + signed number. Direction is
 * carried by the arrow, the sign and a spoken word, so colour is never the only signal.
 */
export const GameCardEffects = ({ effects, id }: GameCardEffectsProps) => (
  <span id={id} role="list" aria-label="Effecten" className="flex flex-col gap-1">
    {effects.map(({ meter, delta }) => {
      const m = GAME_CARD_METERS[meter];
      const d = deltaDirection(delta);
      return (
        <span
          key={meter}
          role="listitem"
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className={cn("flex min-w-0 items-center gap-1.5 font-medium", m.text)}>
            <m.icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{m.label}</span>
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
          </span>
        </span>
      );
    })}
  </span>
);
