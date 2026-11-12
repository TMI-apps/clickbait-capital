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
  button: string;
  meters: readonly string[];
  /** Rows of an event's outcome (in the game: the event dialog). */
  outcomes: readonly string[];
  /** The end-of-run screen. */
  endScreen: string;
}
