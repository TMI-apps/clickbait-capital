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

/** How loud the scandal warning is: 1 under 25 % risk per turn, 2 under 50 %, else 3. */
export type JuiceScandalLevel = "1" | "2" | "3";

/** Variant and vars per event name; `{}` means the event takes neither. */
export interface GameJuiceCatalog {
  /** A draft card was lifted: a drag started or a press turned into a hold; origin = the card. */
  "card.pickup": { variant: JuiceCardVariant };
  /** The dragged card moved over the feed's drop slot (`feed:drop`). */
  "card.over-feed": Record<string, never>;
  /** A drag ended without a play (dropped outside the feed, or Escape). */
  "card.cancel": Record<string, never>;
  /** The chart started showing a card's forecast (held, dragged, opened or focused). */
  "forecast.shown": Record<string, never>;
  /** A follower comment appeared under the newest post (`comment:latest`). */
  "comment.arrived": Record<string, never>;
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
  /** An event's outcome shows in its dialog: the accent of the chosen option's kind. */
  "event.outcome": { variant: JuiceOptionVariant };
  /**
   * One change row of an event's outcome appears: its entrance and gain / loss flash
   * (`dull` for a journalism answer). `vars.row` names the row anchor, e.g. `outcome:users`.
   */
  "outcome.row": { variant: "gain" | "loss" | "dull"; vars: { row: string } };
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
  /** Gebruikers or Geld reached its phase goal line; `vars.meter` names the tile. */
  "goal.reached": { vars: { meter: JuiceMeterKey } };
  /** Geld dropped into the danger zone (Bankroet is a few turns away). */
  "money.danger": Record<string, never>;
  /** The scandal warning appeared or rose a level (never when it falls). */
  "scandal.warning": { variant: JuiceScandalLevel };
  /** A scandal struck: the event an action opened is a scandal. Replaces `event.appeared`. */
  "scandal.hit": Record<string, never>;
  /** A main button was pressed. */
  "ui.press": Record<string, never>;
}

/** Every juice event name. */
export type GameJuiceEventName = keyof GameJuiceCatalog;
