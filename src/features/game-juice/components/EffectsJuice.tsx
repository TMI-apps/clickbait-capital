import { GameCardEffects } from "@/components/common/GameCard";
import type { GameCardEffect, GameCardEffectDecoration } from "@/components/common/GameCard";
import { CountUpNumber } from "@/features/game-juice/components/CountUpNumber";
import { MeterJuice } from "@/features/game-juice/components/MeterJuice";
import { useRevealPlan } from "@/features/game-juice/hooks/useActionJuice";
import type { JuiceAction } from "@/features/game-juice/types/juice.types";

export interface EffectsJuiceProps {
  effects: GameCardEffect[];
  /** Whose juice the reveal plays: a card type, or an event option's kind via `juiceActionForEvent`. */
  action: JuiceAction;
}

/**
 * Meter effects revealed with the action's juice (event-juice-drop D2): the kit's effect rows
 * pop in, each number counts up from 0 and the row flashes gain / loss with the action's accent
 * (flames, gold, shield) — the same plan the board meters get. Rows pop together so the flash
 * and count-up stay in step. Reduced motion shows the final rows at once (the juice durations
 * drop to near zero and the count snaps); accents and numbers stay. Screen readers hear the
 * plain effects (the visible number and the layers are decorative).
 */
export const EffectsJuice = ({ effects, action }: EffectsJuiceProps) => {
  const plan = useRevealPlan(action, effects);
  const decorate = ({ meter, delta, amountText }: GameCardEffect): GameCardEffectDecoration => ({
    // A formatted amount ("€ 2.000") pops in as text; plain points count up from 0.
    amount: amountText ?? (
      <CountUpNumber value={Math.abs(delta)} from={0} instant={!plan.countUp} />
    ),
    overlay: <MeterJuice accent={plan.accents[meter]} flash={plan.flashes[meter]} version={0} />,
    // Right padding keeps the accent badge (top right) clear of the counting number.
    className: "animate-juice-pop rounded-md pr-6 pl-1",
  });
  return <GameCardEffects effects={effects} decorate={decorate} />;
};
