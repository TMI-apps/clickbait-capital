import type {
  MockCard,
  MockCardKind,
  ReputationLevel,
  ScorePoint,
  ScoreState,
  ScoreTurn,
} from "@/features/score-mockup/types/scoreMockup.types";

/**
 * Fake momentum economy for the score-redesign mockup (score-redesign D1). Cards change the
 * trend (growth, revenue per user), the two score numbers follow it gradually. Throwaway: the
 * real model lands in game-engine (DEVELOPMENT_PLAN L1); this file is deleted with the mockup.
 */

/** Phase-2-like numbers so the demo reaches its goal in about ten turns. */
export const MOCK_GOAL = { users: 5_000_000, money: 500_000 } as const;
const MARKET = 8_000_000;
const BASE_GROWTH = 0.03;
const BASE_REVENUE_PER_USER = 0.04;
const FIXED_COSTS = 40_000;
const COST_PER_USER = 0.02;
const MOMENTUM_FADE = 0.55;
const AD_FADE = 0.6;
const DANGER_GROWTH_PENALTY = 0.1;
const DANGER_REVENUE_FACTOR = 0.5;
/** Company value counts each user at this many turns of revenue (variant B). */
const VALUE_TURNS_PER_USER = 25;

export const REPUTATION_WARNING = 40;
export const REPUTATION_DANGER = 25;

const CARD_EFFECTS: Record<MockCardKind, { momentum: number; ad: number; reputation: number }> = {
  viral: { momentum: 0.15, ad: 0, reputation: -9 },
  ad: { momentum: -0.03, ad: 1, reputation: -3 },
  news: { momentum: -0.01, ad: 0, reputation: 12 },
};

export function createScoreState(): ScoreState {
  const start = { users: 1_800_000, money: 120_000 };
  return {
    turn: 0,
    ...start,
    momentum: 0,
    adPressure: 0,
    reputation: 55,
    history: [start],
    lastTurn: null,
  };
}

export function reputationLevel(reputation: number): ReputationLevel {
  if (reputation < REPUTATION_DANGER) return "danger";
  if (reputation < REPUTATION_WARNING) return "warning";
  return "safe";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Revenue per user this turn: ads raise it, the danger zone scares advertisers off. */
export function revenuePerUser(state: Pick<ScoreState, "adPressure" | "reputation">): number {
  const danger = reputationLevel(state.reputation) === "danger";
  return BASE_REVENUE_PER_USER * (1 + state.adPressure) * (danger ? DANGER_REVENUE_FACTOR : 1);
}

/** Bedrijfswaarde (variant B): money plus every user valued at a number of turns of revenue. */
export function companyValue(state: ScoreState): number {
  return state.money + state.users * revenuePerUser(state) * VALUE_TURNS_PER_USER;
}

/** Plays one card (or none: a passive turn for forecasts) and advances one turn. */
export function advanceTurn(state: ScoreState, card: MockCard | null): ScoreState {
  const effect = card ? CARD_EFFECTS[card.kind] : { momentum: 0, ad: 0, reputation: 0 };
  const reputation = clamp(state.reputation + effect.reputation, 0, 100);
  const momentum = state.momentum + effect.momentum;
  const adPressure = state.adPressure + effect.ad;
  const danger = reputationLevel(reputation) === "danger";
  const room = Math.max(0, 1 - state.users / MARKET);
  const growth = clamp(
    (BASE_GROWTH + momentum) * room - (danger ? DANGER_GROWTH_PENALTY : 0),
    -0.15,
    0.25
  );
  const users = Math.round(state.users * (1 + growth));
  const profit = Math.round(
    users * revenuePerUser({ adPressure, reputation }) - FIXED_COSTS - users * COST_PER_USER
  );
  const money = state.money + profit;
  const lastTurn: ScoreTurn = {
    kind: card?.kind ?? null,
    title: card?.title ?? "",
    growth,
    profit,
    usersDelta: users - state.users,
    reputationDelta: reputation - state.reputation,
  };
  return {
    turn: state.turn + 1,
    users,
    money,
    momentum: momentum * MOMENTUM_FADE,
    adPressure: adPressure * AD_FADE,
    reputation,
    history: [...state.history, { users, money }],
    lastTurn,
  };
}

/** The next `turns` points if this card is played now and nothing after (the preview line). */
export function forecast(state: ScoreState, card: MockCard, turns = 3): ScorePoint[] {
  const points: ScorePoint[] = [];
  let next = advanceTurn(state, card);
  points.push({ users: next.users, money: next.money });
  for (let index = 1; index < turns; index += 1) {
    next = advanceTurn(next, null);
    points.push({ users: next.users, money: next.money });
  }
  return points;
}

/** The turn a card would cause, for the preview chips (growth and profit, no reputation). */
export function previewTurn(state: ScoreState, card: MockCard): ScoreTurn {
  return advanceTurn(state, card).lastTurn!;
}

const CARD_TITLES: Record<MockCardKind, string[]> = {
  viral: ["Dansje gaat viraal", "Ruzie tussen streamers", "Nep-giveaway", "Challenge op het plein"],
  ad: ["Skins in de shop", "Gesponsorde stream", "Loot box-actie", "Reclame voor sneakers"],
  news: [
    "Factcheck van de week",
    "Uitleg: wat is een algoritme?",
    "Eerlijke foutmelding",
    "Onderzoek naar nepnieuws",
  ],
};

/** The mock hand: one card of each kind, titles rotating per turn so plays feel different. */
export function mockHand(turn: number): MockCard[] {
  const kinds: MockCardKind[] = ["viral", "ad", "news"];
  return kinds.map((kind) => {
    const titles = CARD_TITLES[kind];
    return { id: `${kind}-${turn}`, kind, title: titles[turn % titles.length]! };
  });
}

/** Scripted demo: chase growth and money until reputation breaks, then repair it with news. */
export const DEMO_SCRIPT: readonly MockCardKind[] = [
  "viral",
  "viral",
  "ad",
  "viral",
  "viral",
  "ad",
  "news",
  "news",
];
