import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { CapBadge } from "./CapBadge";
import type { GameCardEffect } from "./gameCard.types";
import { GAME_CARD_METERS, deltaDirection } from "./gameCardVariants";

/** Optional per-row extras, e.g. an animated number or a flash layer (decorative only). */
export interface GameCardEffectDecoration {
  /** Replaces the visible number (not the sign or arrow); screen readers keep the real value. */
  amount?: ReactNode;
  /** Layered over the row (rows are `relative`); render it `aria-hidden`. */
  overlay?: ReactNode;
  className?: string;
}

export interface GameCardEffectsProps {
  effects: GameCardEffect[];
  /** Per-row extras for an animated reveal; the rows stay static without it. */
  decorate?: (effect: GameCardEffect, index: number) => GameCardEffectDecoration;
  id?: string;
  /** Meter icon + number only; the meter name is screen-reader text. */
  compact?: boolean;
}

interface EffectRowProps {
  effect: GameCardEffect;
  compact: boolean;
  /** Not the last row: screen readers hear a comma after it. */
  more: boolean;
  extra: GameCardEffectDecoration | undefined;
}

const EffectRow = ({ effect, compact, more, extra = {} }: EffectRowProps) => {
  const { meter, delta, overflow = 0 } = effect;
  const m = GAME_CARD_METERS[meter];
  const d = deltaDirection(delta);
  return (
    <span
      role="listitem"
      className={cn(
        "flex items-center justify-between",
        "relative",
        compact ? "gap-1 text-xs" : "gap-2 text-sm",
        extra.className
      )}
    >
      {extra.overlay}
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
          {extra.amount ?? Math.abs(delta)}
        </span>
        <span className="sr-only">
          {d.spoken} {Math.abs(delta)}
        </span>
        {overflow > 0 && (
          <CapBadge className="ml-0.5" srText={`, ${overflow} verspild boven het maximum`} />
        )}
        {more && <span className="sr-only">, </span>}
      </span>
    </span>
  );
};

/**
 * Meter effects as rows: meter icon + name, then arrow + signed number, and a "MAX" mark when
 * part of a gain is lost at the meter's cap. Direction is carried by the arrow, the sign and a
 * spoken word, so colour is never the only signal.
 */
export const GameCardEffects = ({
  effects,
  id,
  compact = false,
  decorate,
}: GameCardEffectsProps) => (
  <span id={id} className="flex flex-col gap-1">
    {/* Text, not an aria-label on the list: a label would replace the effects in the card's
        computed name / description (screen-reader D4). */}
    <span className="sr-only">Effecten: </span>
    <span role="list" className="flex flex-col gap-1">
      {effects.map((effect, index) => (
        <EffectRow
          key={effect.meter}
          effect={effect}
          compact={compact}
          more={index < effects.length - 1}
          extra={decorate?.(effect, index)}
        />
      ))}
    </span>
  </span>
);
