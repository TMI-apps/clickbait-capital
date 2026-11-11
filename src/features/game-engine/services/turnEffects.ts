import type {
  BalanceConfig,
  CardDefinition,
  CardType,
  Effects,
  FullEffects,
  PhaseDefinition,
  ScoreKey,
} from "@/features/game-engine/types/gameContent.types";
import type { TurnModifiers } from "@/features/game-engine/types/gameState.types";

/**
 * Per-turn rule math: card modifiers (Ad-Fatigue, Echo-Chamber),
 * phase scaling, passive costs, reputation decay, toxicity drain, and how points land on the
 * absolute score (score-redesign D11, D20). Pure; no game-state shape.
 */

const METER_MIN = 0;
const METER_MAX = 100;

/** What one card turn needs to know about the game so far. */
export interface CardTurnInput {
  card: CardDefinition;
  /** Card types played before this turn, oldest first. */
  playedTypes: readonly CardType[];
  viralStreak: number;
  turnsWithoutNews: number;
  /** Hidden Toxicity before the turn: drains reputation (score-redesign D21). */
  toxicity: number;
  phase: PhaseDefinition;
  balance: BalanceConfig;
}

/** The outcome of one card turn, plus the updated streak counters. */
export interface CardTurnResult {
  /** The card's own effect after modifiers and phase scaling (its gain is scaled by the audience). */
  cardEffects: FullEffects;
  /** Card effects plus passive costs, reputation decay and toxicity drain. */
  totalEffects: FullEffects;
  modifiers: TurnModifiers;
  viralStreak: number;
  turnsWithoutNews: number;
}

/** Fills missing keys with 0. */
export function toFullEffects(effects: Effects): FullEffects {
  return {
    revenue: effects.revenue ?? 0,
    users: effects.users ?? 0,
    reputation: effects.reputation ?? 0,
    toxicity: effects.toxicity ?? 0,
  };
}

function addEffects(a: FullEffects, b: Effects): FullEffects {
  const full = toFullEffects(b);
  return {
    revenue: a.revenue + full.revenue,
    users: a.users + full.users,
    reputation: a.reputation + full.reputation,
    toxicity: a.toxicity + full.toxicity,
  };
}

/** Rounds half away from zero so scaled gains and losses round alike (and never to -0). */
function roundSymmetric(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value)) || 0;
}

function scaleGain(value: number, multiplier: number): number {
  return value > 0 ? roundSymmetric(value * multiplier) : value;
}

function scaleLoss(value: number, multiplier: number): number {
  return value < 0 ? roundSymmetric(value * multiplier) : value;
}

/** Scales reputation loss and revenue gain by the phase (design § 6). Used for cards and events. */
export function scaleForPhase(effects: Effects, phase: PhaseDefinition): FullEffects {
  const full = toFullEffects(effects);
  return {
    ...full,
    revenue: scaleGain(full.revenue, phase.revenueGainMultiplier),
    reputation: scaleLoss(full.reputation, phase.reputationLossMultiplier),
  };
}

/** True when the ad would be the "next" ad after N ads within the window (design § 7). */
function isAdFatigued(playedTypes: readonly CardType[], balance: BalanceConfig): boolean {
  const recent = playedTypes.slice(-balance.adFatigue.window);
  return recent.filter((type) => type === "ad").length >= balance.adFatigue.adsInWindow;
}

interface ModifiedCard {
  effects: FullEffects;
  adFatigue: boolean;
  echoChamber: boolean;
}

function applyAdFatigue(effects: FullEffects, balance: BalanceConfig): FullEffects {
  const { revenueMultiplier, userLossMultiplier } = balance.adFatigue;
  return {
    ...effects,
    revenue: scaleGain(effects.revenue, revenueMultiplier),
    users: scaleLoss(effects.users, userLossMultiplier),
  };
}

function applyViralModifiers(
  input: CardTurnInput,
  effects: FullEffects,
  viralStreak: number
): ModifiedCard {
  const { echoChamber } = input.balance;
  const frenzy = viralStreak >= echoChamber.streak;
  const users = frenzy ? scaleGain(effects.users, echoChamber.userGainMultiplier) : effects.users;
  const frenzyToxicity = viralStreak === echoChamber.streak ? echoChamber.toxicity : 0;
  return {
    effects: { ...effects, users, toxicity: effects.toxicity + frenzyToxicity },
    adFatigue: false,
    echoChamber: frenzy,
  };
}

function applyCardModifiers(input: CardTurnInput, viralStreak: number): ModifiedCard {
  const effects = toFullEffects(input.card.effects);
  const none = { effects, adFatigue: false, echoChamber: false };
  if (input.card.type === "viral") {
    return applyViralModifiers(input, effects, viralStreak);
  }
  if (input.card.type === "ad" && isAdFatigued(input.playedTypes, input.balance)) {
    return { ...none, effects: applyAdFatigue(effects, input.balance), adFatigue: true };
  }
  return none;
}

/** Computes everything one played card does this turn, including passive costs and decay. */
export function computeCardTurn(input: CardTurnInput): CardTurnResult {
  const { card, balance, phase } = input;
  const isNews = card.type === "news";
  const viralStreak = card.type === "viral" ? input.viralStreak + 1 : 0;
  const turnsWithoutNews = isNews ? 0 : input.turnsWithoutNews + 1;

  const modified = applyCardModifiers(input, viralStreak);
  const scaled = scaleForPhase(modified.effects, phase);
  const cardEffects = isNews
    ? scaled
    : addEffects(scaled, { toxicity: balance.newsIgnoredToxicity });

  const reputationDecay = turnsWithoutNews >= balance.reputationDecay.afterTurnsWithoutNews;
  const decay = reputationDecay
    ? scaleLoss(-balance.reputationDecay.amount, phase.reputationLossMultiplier)
    : 0;
  const { from, perPoint } = balance.toxicityDrain;
  const drain = -Math.round(Math.max(0, input.toxicity - from) * perPoint);
  const totalEffects = addEffects(addEffects(cardEffects, phase.passiveCosts), {
    reputation: decay + drain,
  });

  return {
    cardEffects,
    totalEffects,
    modifiers: {
      adFatigue: modified.adFatigue,
      echoChamber: modified.echoChamber,
      reputationDecay,
    },
    viralStreak,
    turnsWithoutNews,
  };
}

function clamp(value: number): number {
  return Math.min(METER_MAX, Math.max(METER_MIN, value));
}

const AUDIENCE_MAX = 1.5;

/** How much ads pay at this many users: users / audienceUsers, 0–1.5 (score-redesign D20). */
export function audienceFactor(users: number, phase: PhaseDefinition): number {
  if (!(phase.audienceUsers > 0)) {
    throw new Error(`game-engine: phase ${phase.id} needs a positive audienceUsers`);
  }
  return Math.min(AUDIENCE_MAX, Math.max(0, users / phase.audienceUsers));
}

/** The score and hidden values one turn changes. */
export interface ScoreSnapshot {
  users: number;
  money: number;
  reputation: number;
  toxicity: number;
}

/** What a turn's effects do: the new values and the absolute change on the score. */
export interface ScoreChange extends ScoreSnapshot {
  delta: Record<ScoreKey, number>;
}

/**
 * Lands one turn on the score (score-redesign D11, D20, D26): users gains × `usersPerPoint`,
 * users losses take `userLossPerPoint` of the current users per point; money: the gain part of `gainEffects` scaled by the audience before the turn,
 * the rest of `effects.revenue` (losses, passive costs) at full price. Reputation and Toxicity
 * clamp to 0–100. `gainEffects` defaults to `effects` (events have no costs).
 */
export function applyScore(
  current: ScoreSnapshot,
  effects: FullEffects,
  context: { phase: PhaseDefinition; userLossPerPoint: number; gainEffects?: FullEffects }
): ScoreChange {
  const { phase } = context;
  const gain = Math.max(0, (context.gainEffects ?? effects).revenue);
  const rest = effects.revenue - gain;
  const moneyDelta = Math.round(
    gain * phase.moneyPerPoint * audienceFactor(current.users, phase) + rest * phase.moneyPerPoint
  );
  const usersDelta =
    effects.users >= 0
      ? Math.round(effects.users * phase.usersPerPoint)
      : -Math.round(current.users * Math.min(1, -effects.users * context.userLossPerPoint));
  const users = Math.max(0, current.users + usersDelta);
  const money = current.money + moneyDelta;
  return {
    users,
    money,
    reputation: clamp(current.reputation + effects.reputation),
    toxicity: clamp(current.toxicity + effects.toxicity),
    delta: { users: users - current.users, money: moneyDelta },
  };
}
