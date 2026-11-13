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

/** A phase number as a variant (`phase.intro`). */
export type JuicePhaseVariant = "1" | "2" | "3" | "4";

/** A meter tile the juice targets (`meter:<key>` anchors). */
export type JuiceMeterKey = "users" | "revenue" | "reputation";

/** How loud the scandal warning is: 1 under 25 % risk per turn, 2 under 50 %, else 3. */
export type JuiceScandalLevel = "1" | "2" | "3";

/** How far a chart line moved in one action (thresholds: `CHART_MOVE_TIERS`). */
export type JuiceChartMoveTier = "small" | "medium" | "big" | "huge";

/** A chart line's move: its direction and tier, or `dull` (news / journalism, design § 5). */
export type JuiceChartMoveVariant = `${"up" | "down"}-${JuiceChartMoveTier}` | "dull";

/** A streak's length as a variant: 3 to 7, and `8` for 8 or more (`STREAK_LEVELS`). */
export type JuiceStreakStep = "3" | "4" | "5" | "6" | "7" | "8";

/** An event without variant or vars (it may still carry the engine's `origin` / `strength`). */
export interface JuiceNoFields {
  variant?: never;
  vars?: never;
}

/** Variant and vars per event name; `JuiceNoFields` means the event takes neither. */
export interface GameJuiceCatalog {
  /** A draft card was lifted: a drag started or a press turned into a hold; origin = the card. */
  "card.pickup": { variant: JuiceCardVariant };
  /** The dragged card moved over the feed's drop slot (`feed:drop`). */
  "card.over-feed": JuiceNoFields;
  /** A drag ended without a play (dropped outside the feed, or Escape). */
  "card.cancel": JuiceNoFields;
  /** The chart started showing a card's forecast (held, dragged, opened or focused). */
  "forecast.shown": JuiceNoFields;
  /** A follower comment appeared under the newest post (`comment:latest`). */
  "comment.arrived": JuiceNoFields;
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
  /**
   * A score chart line moved: its newest stretch draws in and its end dot reacts, louder the
   * further it moved (`CHART_MOVE_TIERS`). `vars.meter` names the line (`chart-tail:<meter>`,
   * `chart-dot:<meter>`).
   */
  "chart.moved": { variant: JuiceChartMoveVariant; vars: { meter: JuiceMeterKey } };
  /**
   * Gebruikers or Geld went up again: a streak of `vars.count` actions in a row, from the first
   * streak level (`STREAK_LEVELS`). Variant = the count, `8` for 8 or more.
   */
  "streak.step": { variant: JuiceStreakStep; vars: { meter: JuiceMeterKey; count: number } };
  /** A streak of at least the first level ended (the number did not go up). */
  "streak.broken": { vars: { meter: JuiceMeterKey; count: number } };
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
  "event.appeared": JuiceNoFields;
  /** The player chose an event option (the outcome shows next). */
  "event.choice": JuiceNoFields;
  /** The next phase was reached. */
  "phase.up": JuiceNoFields;
  /** The run ended in the IPO. */
  "run.won": JuiceNoFields;
  /** The run ended in a loss (bankrupt, abandoned, banned). */
  "run.lost": JuiceNoFields;
  /** Gebruikers or Geld reached its phase goal line; `vars.meter` names the tile. */
  "goal.reached": { vars: { meter: JuiceMeterKey } };
  /** Geld dropped into the danger zone (Bankroet is a few turns away). */
  "money.danger": JuiceNoFields;
  /** The scandal warning appeared or rose a level (never when it falls). */
  "scandal.warning": { variant: JuiceScandalLevel };
  /** A scandal struck: the event an action opened is a scandal. Replaces `event.appeared`. */
  "scandal.hit": JuiceNoFields;
  /** Any button or link was pressed (delegated app-wide); origin = the control. */
  "ui.press": JuiceNoFields;
  /** A page opened by navigation (not the first page load): its entrance. */
  "page.opened": JuiceNoFields;
  /** A phase intro screen opened; variant = the phase. */
  "phase.intro": { variant: JuicePhaseVariant };
  /** The share of a result finished; variant = how it went. */
  "share.done": { variant: "shared" | "failed" };
}

/** Every juice event name. */
export type GameJuiceEventName = keyof GameJuiceCatalog;
