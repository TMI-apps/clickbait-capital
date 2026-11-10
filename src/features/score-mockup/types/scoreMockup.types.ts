/** Card kinds of the mockup hand (mirrors the game's three card types, no engine import). */
export type MockCardKind = "viral" | "ad" | "news";

/** HUD variant on `/mockup/score?v=`: two tickers, company value, or stock chart. */
export type ScoreHudVariant = "a" | "b" | "c";

/** How loud reputation is: silent while safe, amber in warning, red in the danger zone. */
export type ReputationLevel = "safe" | "warning" | "danger";

export interface MockCard {
  id: string;
  kind: MockCardKind;
  title: string;
}

/** One point of the run history (sparklines, chart). */
export interface ScorePoint {
  users: number;
  money: number;
}

/** What the last turn did: rates and changes the HUD animates and labels. */
export interface ScoreTurn {
  kind: MockCardKind | null;
  title: string;
  /** Growth rate applied this turn (0.08 = +8 % users). */
  growth: number;
  /** Money earned this turn (winst per beurt, can be negative). */
  profit: number;
  usersDelta: number;
  reputationDelta: number;
}

/** Full fake run state; immutable, every call returns a new object. */
export interface ScoreState {
  turn: number;
  users: number;
  money: number;
  /** Card impulse on growth that fades every turn. */
  momentum: number;
  /** Ad impulse on revenue per user that fades every turn. */
  adPressure: number;
  /** 0–100, hidden while safe; 0 = verbod. */
  reputation: number;
  history: ScorePoint[];
  lastTurn: ScoreTurn | null;
}

/** How a tweened score number is written. */
export type ScoreFormat = "count" | "money";

/** A signed trend label and its direction ("+8,2%/beurt", up). */
export interface TrendView {
  text: string;
  positive: boolean;
}

/** One score number as the HUD shows it (variants A and C). */
export interface TickerView {
  value: number;
  format: ScoreFormat;
  trend: TrendView | null;
  /** What the selected card would do this turn. */
  preview: TrendView | null;
  points: number[];
  forecast: number[] | null;
  goal: number;
  goalText: string;
  reached: boolean;
  /** Share of the goal per point and forecast point (variant C chart; 1 = goal). */
  shares: number[];
  forecastShares: number[] | null;
}

/** Variant B: Bedrijfswaarde and its breakdown. */
export interface CompanyValueView {
  value: number;
  change: TrendView | null;
  preview: TrendView | null;
  usersText: string;
  perUserText: string;
  moneyText: string;
  /** 0–1 towards the value goal. */
  progress: number;
  goalText: string;
}

/** One feed post of the mockup. */
export interface MockFeedPost {
  key: number;
  kind: MockCardKind | null;
  title: string;
  effectText: string;
}

/** Everything the HUD variants render, derived from the fake state. */
export interface ScoreHudView {
  turn: number;
  level: ReputationLevel;
  reputation: number;
  users: TickerView;
  money: TickerView;
  company: CompanyValueView;
  feed: MockFeedPost[];
}
