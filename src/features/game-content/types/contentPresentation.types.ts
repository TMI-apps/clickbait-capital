/**
 * Presentation fields the game-content feature adds next to the engine schema. The engine
 * reads only the rules fields (`@/features/game-engine/api`); boards and the imagery lap read
 * these. Kept free of engine imports so the types layer stays runtime-free.
 */

/** Hints for the imagery lap, which sources one image per card or event id. */
export interface ImageHint {
  /** Short English art direction (subject, mood) for sourcing or generating an image. */
  imageTheme: string;
  /** Dutch alt text for the final image (screen readers). */
  imageAlt: string;
}

/**
 * How a decision card is announced on the app's official account (policy-cards § 4): the
 * company's friendly spin, while the card body says what the decision really does. Plain text.
 */
export interface CardAnnouncement {
  title: string;
  body: string;
}

/**
 * The real event a decision card is based on (policy-cards § 5b, D3): one plain Dutch line
 * without brand names, and one open news article the card detail links to in a new tab.
 */
export interface RealCase {
  /** "Echt gebeurd: …" sentence, plain text (no glossary markup, no brand names). */
  line: string;
  /** Article url (https). The article itself may name companies. */
  url: string;
  /** Outlet name, read in the link's accessible name ("… bij NPR"). */
  publisher: string;
  /** Publication date as shown to a teacher, e.g. "sep. 2023". */
  date: string;
}

/** What a card adds on top of the engine's `CardDefinition`. */
export interface CardPresentation extends ImageHint {
  /** Dutch one-liner under the body: the satirical punchline. */
  flavor: string;
  /**
   * Present on a decision card (policy-cards D1): a company decision inside its usual type,
   * shown in the feed as an official post. No engine flag: the engine ignores this field.
   */
  announce?: CardAnnouncement;
  /** The real event behind a decision card, shown only in the card detail. */
  realCase?: RealCase;
}

/** What an event adds on top of the engine's `EventDefinition`. */
export type EventPresentation = ImageHint;

/** Dutch intro screen shown when a phase starts. */
export interface PhaseIntro {
  /** Small label above the title, e.g. "Fase 1". */
  kicker: string;
  title: string;
  body: string;
  /** One concrete hint about what changes in this phase. */
  tip: string;
}

/** One telling of a game over: how this run got there and what to take away. */
export interface GameOverStory {
  /** Short headline in newspaper style. */
  headline: string;
  body: string;
  /** What the player should take away (the learning goal of the vision). */
  lesson: string;
}

/** Dutch end screen for one way of losing: the shared title plus the run-matched story. */
export interface GameOverText extends GameOverStory {
  title: string;
  /** Which story was picked (`GAME_OVER_TEXTS[reason].variants` key). */
  variant: string;
}

/** Numbers the IPO end report is built from (a subset of the engine's `GameState`). */
export interface EndReportInput {
  turn: number;
  /** Peak users and final money of the run. */
  score: { users: number; money: number };
  playedTypes: readonly ("viral" | "ad" | "news")[];
  firedEventIds: readonly string[];
  /** The player's app name for `{app}` (app-name AN1); "Jouw app" when absent. */
  appName?: string;
}

/** One line of the end report: a label and its filled-in value. */
export interface EndReportLine {
  id: string;
  label: string;
  value: string;
}

/** The filled-in IPO end report. */
export interface EndReport {
  title: string;
  intro: string;
  lines: EndReportLine[];
  closing: string;
}

/**
 * What a follower reacts to in the feed comments (follower-chat D2): the post's topic (a card type,
 * or the card type an event option plays like) or a state of the run.
 */
export type FollowerCue =
  | "viral"
  | "ad"
  | "news"
  /** Many new users this turn. */
  | "hype"
  /** Hidden Toxicity is high: the comments get mean. */
  | "toxic"
  /** Reputation is low: critical followers complain. */
  | "complain"
  | "adFatigue"
  | "echoChamber"
  /**
   * The post is an official decision announcement (policy-cards § 8), one cue per direction:
   * replaces the type cue under a decision card's post.
   */
  | "officialViral"
  | "officialAd"
  | "officialNews";

/** Avatar tint of a follower; maps to a theme token in the comments component. */
export type FollowerTone = "viral" | "ad" | "news" | "primary" | "success" | "warning";

/** One recurring follower who comments under feed posts: a face, a name and lines per cue. */
export interface FollowerPersona {
  id: string;
  /** Handle shown before the comment. Invented, never a real person or brand. */
  name: string;
  /** One emoji: the follower's face. */
  face: string;
  tone: FollowerTone;
  /** Critical followers complain when reputation drops and leave when it is very low. */
  critical: boolean;
  /** Short Dutch comments (age ~11) per cue; a follower without lines for a cue stays quiet. */
  lines: Partial<Record<FollowerCue, readonly string[]>>;
}
