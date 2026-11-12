/*
 * The game's juice event catalog: every moment gameplay and UI announce, with its variants and
 * template vars. Emit with `emitJuice(name, payload)` from `@/features/game-juice/api`; the
 * recipe for each lives in `services/gameJuiceRecipes.ts`. Add a moment here first, then its
 * recipe (the recipe test fails until both exist).
 *
 * Kept free of other features' imports (types files may not import runtime barrels); the
 * runtime adds the engine's payload fields (`origin`, `strength`) to each entry.
 */

/** A card type, as the juice reads it (mirrors the engine's card types). */
export type JuiceCardVariant = "viral" | "ad" | "news";

/** An event option's kind (mirrors the engine's `EventOptionKind`). */
export type JuiceOptionVariant = "engagement" | "commercial" | "journalism";

/** A meter tile the juice targets (`meter:<key>` anchors). */
export type JuiceMeterKey = "users" | "revenue" | "reputation";

/** Variant and vars per event name; `{}` means the event takes neither. */
export interface GameJuiceCatalog {
  /** A card was played (from the draft or dropped on the feed); origin = the card. */
  "card.played": { variant: JuiceCardVariant };
  /** An answered event's consequences land on the board (after its dialog closed). */
  "event.resolved": { variant: JuiceOptionVariant };
  /**
   * A meter moved. `dull` for a news post (no flash, design § 5); `-big` when the move is large
   * enough to earn a sound (≥ 10 % of its value). `vars.meter` names the tile, `vars.text` the change.
   */
  "meter.changed": {
    variant: "gain" | "loss" | "gain-big" | "loss-big" | "dull";
    vars: { meter: JuiceMeterKey; text?: string };
  };
  /** A post landed at the top of the feed. */
  "feed.landed": { variant: JuiceCardVariant | "event" };
  /** An event interrupts play. */
  "event.appeared": Record<string, never>;
  /** The player chose an event option (the outcome shows next). */
  "event.choice": Record<string, never>;
  /** The next phase was reached. */
  "phase.up": Record<string, never>;
  /** The run ended in the IPO. */
  "run.won": Record<string, never>;
  /** The run ended in a loss (bankrupt, abandoned, banned). */
  "run.lost": Record<string, never>;
  /** A main button was pressed. */
  "ui.press": Record<string, never>;
}

/** Every juice event name. */
export type GameJuiceEventName = keyof GameJuiceCatalog;
