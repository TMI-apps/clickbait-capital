// Second copy: replaced by the juice recipes (`gameJuiceRecipes.ts`); juice-core lap 2 deletes this.
import type { ReactNode } from "react";
import { useEndBurst } from "@/features/game-juice/hooks/useActionJuice";
import { useReducedMotion } from "@/features/game-settings/api";
import { JuiceLayer } from "./JuiceLayer";

export interface EndJuiceProps {
  outcome: "won" | "lost";
  children: ReactNode;
}

/**
 * Entrance for the end of a run: the screen zooms in; a win throws confetti and money with a
 * gold flash (the IPO is satire, so it is loud), a loss gets only a short red flash. Reduced
 * motion shows the screen at once with no particles or flash.
 */
export const EndJuice = ({ outcome, children }: EndJuiceProps) => {
  const reduced = useReducedMotion();
  const burst = useEndBurst(outcome);
  const flash = outcome === "won" ? "win" : "loss";
  return (
    <>
      <div className="animate-juice-end">{children}</div>
      <JuiceLayer burst={burst} flash={reduced ? undefined : flash} />
    </>
  );
};
