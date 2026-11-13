/** One trigger button: an event, optionally one of its variants. */
export interface InspectorEntry {
  event: string;
  /** Null for an event without variants (only shared steps). */
  variant: string | null;
  /** "card.played · viral" — also the button's accessible name. */
  label: string;
  /** First part of the event name ("card"), for grouping. */
  domain: string;
}

/** Names of the mock board's anchors (must match what the recipes target). */
export interface InspectorAnchorNames {
  board: string;
  card: string;
  chart: string;
  feed: string;
  /** The drop slot a dragged card opens above the feed. */
  drop: string;
  /** The newest shown follower comment under the newest post. */
  comment: string;
  button: string;
  /** The score counters over the chart (Gebruikers, Geld). */
  meters: readonly string[];
  /** Each chart line's newest segment and end dot (`chart-tail:<key>`, `chart-dot:<key>`). */
  chartLines: readonly string[];
  /** The streak chips on the counters (`streak:<key>`). */
  streaks: readonly string[];
  /** The scandal warning under the chart. */
  scandal: string;
  /** Rows of an event's outcome (in the game: the event dialog). */
  outcomes: readonly string[];
  /** The end-of-run screen. */
  endScreen: string;
  /** The ending's icon (bell / server) inside the end screen. */
  endingIcon: string;
  /** The event dialog panel. */
  eventDialog: string;
  /** The phase intro's current step dot and goal box. */
  phaseStep: string;
  phaseGoal: string;
}
