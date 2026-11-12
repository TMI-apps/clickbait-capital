import { useCallback } from "react";
import { GameCardEffects } from "@/components/common/GameCard";
import type { GameCardEffect, GameCardEffectDecoration } from "@/components/common/GameCard";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import { CountUpNumber } from "@/features/game-juice/components/CountUpNumber";
import { outcomeRowAnchor, useOutcomeJuice } from "@/features/game-juice/hooks/useOutcomeJuice";
import type { JuiceOptionVariant } from "@/features/game-juice/types/gameJuiceEvents.types";

export interface EffectsJuiceProps {
  effects: GameCardEffect[];
  /** The chosen option's kind: its accent plays on the rows; journalism stays dull. */
  kind?: JuiceOptionVariant;
}

/**
 * Registers its row (the parent the kit renders it in) as the juice anchor `outcome:<meter>`,
 * so the entrance moves the row itself and flashes cover it; renders nothing visible.
 */
const RowAnchor = ({ meter }: { meter: GameCardEffect["meter"] }) => {
  const register = useJuiceAnchor(outcomeRowAnchor(meter));
  const ref = useCallback(
    (marker: HTMLSpanElement | null) => register(marker?.parentElement ?? null),
    [register]
  );
  return <span ref={ref} aria-hidden="true" hidden />;
};

/**
 * An event outcome's changes, revealed with juice (event-juice-drop D2, juice-migrate D8): each
 * row enters and flashes gain / loss and the option kind's accent shows (`event.outcome`,
 * `outcome.row` recipes), while the number counts up from 0 — at once for journalism (ethics
 * stays dull, design § 5) or under reduced motion. Screen readers hear the plain effects.
 */
export const EffectsJuice = ({ effects, kind }: EffectsJuiceProps) => {
  useOutcomeJuice(effects, kind);
  const decorate = ({ meter, delta, amountText }: GameCardEffect): GameCardEffectDecoration => ({
    // A formatted amount ("€ 2.000") shows as text; plain points count up from 0.
    amount: amountText ?? (
      <CountUpNumber value={Math.abs(delta)} from={0} instant={kind === "journalism"} />
    ),
    overlay: <RowAnchor meter={meter} />,
    // Right padding keeps the accent badge (top right) clear of the counting number.
    className: "rounded-md pr-6 pl-1",
  });
  return <GameCardEffects effects={effects} decorate={decorate} />;
};
