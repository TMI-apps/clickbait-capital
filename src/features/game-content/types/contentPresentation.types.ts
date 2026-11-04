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

/** What a card adds on top of the engine's `CardDefinition`. */
export interface CardPresentation extends ImageHint {
  /** Dutch one-liner under the body: the satirical punchline. */
  flavor: string;
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

/** Dutch end screen for one way of losing. */
export interface GameOverText {
  title: string;
  /** Short headline in newspaper style. */
  headline: string;
  body: string;
  /** What the player should take away (the learning goal of the vision). */
  lesson: string;
}

/** Numbers the IPO end report is built from (a subset of the engine's `GameState`). */
export interface EndReportInput {
  turn: number;
  stats: { users: number; revenue: number };
  playedTypes: readonly ("viral" | "ad" | "news")[];
  firedEventIds: readonly string[];
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
