/** One label/value row on the share card. */
export interface ShareCardStat {
  label: string;
  value: string;
}

/**
 * Everything the share card shows and the share sheet sends. The caller (game-flow) fills it
 * from the run; this feature only draws and shares it, so it holds no game copy itself.
 */
export interface ShareCardContent {
  /** Brand line at the top of the image ("Clickbait Capital"). */
  appName: string;
  /** Small label above the title ("Game over", "Beursgang geslaagd"). */
  kicker: string;
  /** Ending title ("Bankroet", "Gefeliciteerd met je beursgang!"). */
  title: string;
  /** The punchy line: the ending's headline or closing question. */
  line: string;
  stats: ShareCardStat[];
  /** Small text above the link at the bottom of the image ("Speel gratis op"). */
  footerLabel: string;
  /** Title for the share sheet. */
  shareTitle: string;
  /** Message for the share sheet and the copied text. */
  text: string;
  /** Game link that is shared and printed on the image. */
  url: string;
  /** File name of the PNG ("clickbait-capital-resultaat.png"). */
  fileName: string;
}

/** How a share attempt ended; the button turns it into a status message. */
export type ShareOutcome =
  | "shared"
  | "shared-link"
  | "downloaded-and-copied"
  | "downloaded"
  | "copied"
  | "cancelled"
  | "failed";

/** Browser capabilities the share strategy uses; injected so it is testable without a browser. */
export interface ShareEnvironment {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  writeText?: (text: string) => Promise<void>;
  download: (image: Blob, fileName: string) => void;
}

/** Button label and one status message per outcome; empty means "say nothing". */
export interface ShareResultCopy {
  buttonLabel: string;
  statuses: Record<ShareOutcome, string>;
}
