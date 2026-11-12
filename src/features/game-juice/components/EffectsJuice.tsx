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

/** Covers one row so the juice can target it; decorative. */
const RowAnchor = ({ meter }: { meter: GameCardEffect["meter"] }) => {
  const ref = useJuiceAnchor(outcomeRowAnchor(meter));
  return <span ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
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
