import { ShieldCheck } from "lucide-react";
import type { MeterAccent, MeterFlash } from "@/features/game-juice/types/juice.types";
import { cn } from "@/shared/utils/cn";

export interface MeterJuiceProps {
  accent?: MeterAccent;
  flash?: MeterFlash;
  /** Changes once per action so the flash and accent restart. */
  version: number;
}

/** Glow ring per accent; animated by opacity / scale only. */
const GLOW: Partial<Record<MeterAccent, string>> = {
  flames: "ring-2 ring-type-viral shadow-[0_0_18px_4px_var(--type-viral)]",
  gold: "ring-2 ring-type-ad shadow-[0_0_18px_4px_var(--type-ad)]",
};

/** Badge per accent: a shape, so colour is never the only signal. */
const AccentBadge = ({ accent }: { accent: MeterAccent }) => {
  if (accent === "shield") {
    // News: small, neutral, no animation beyond a dry fade (design § 5).
    return (
      <ShieldCheck
        data-juice-accent="shield"
        className="absolute -top-2 -right-1 size-5 animate-juice-slide rounded-full bg-card p-0.5 text-success"
      />
    );
  }
  return (
    <span
      data-juice-accent={accent}
      className="absolute -top-3 -right-1 animate-juice-pop text-lg leading-none"
    >
      {accent === "flames" ? "🔥" : "💰"}
    </span>
  );
};

/**
 * Per-meter feedback layered over a meter tile (the tile must be `relative`): a gain / loss
 * flash and the action's accent — flames on Gebruikers (viral), gold glow on Inkomsten (ad),
 * a small shield on Reputatie (news). Decorative: the delta chip states the change.
 */
export const MeterJuice = ({ accent, flash, version }: MeterJuiceProps) => (
  <span aria-hidden="true" key={version} className="pointer-events-none absolute inset-0">
    {flash && (
      <span
        data-juice-flash={flash}
        className={cn(
          "absolute inset-0 animate-juice-flash rounded-lg",
          flash === "gain" ? "bg-success/20" : "bg-destructive/20"
        )}
      />
    )}
    {accent && GLOW[accent] && (
      <span className={cn("absolute inset-0 animate-juice-glow rounded-lg", GLOW[accent])} />
    )}
    {accent && <AccentBadge accent={accent} />}
  </span>
);
