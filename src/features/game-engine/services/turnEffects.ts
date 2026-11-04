import type {
  BalanceConfig,
  CardDefinition,
  CardType,
  Effects,
  MeterKey,
  PhaseDefinition,
} from "@/features/game-engine/types/gameContent.types";
import type { TurnModifiers } from "@/features/game-engine/types/gameState.types";

/**
 * Per-turn rule math: card modifiers (Ad-Fatigue, Echo-Chamber, Journalistieke Droogte),
 * phase scaling, passive costs, reputation decay and clamping. Pure; no game-state shape.
 */

export type FullEffects = Required<Effects>;

const METER_MIN = 0;
const METER_MAX = 100;

export interface CardTurnInput {
  card: CardDefinition;
  /** Card types played before this turn, oldest first. */
  playedTypes: readonly CardType[];
  viralStreak: number;
  turnsWithoutNews: number;
  phase: PhaseDefinition;
  balance: BalanceConfig;
}

export interface CardTurnResult {
  /** The card's own effect after modifiers and phase scaling (feeds the absolute stats). */
  cardEffects: FullEffects;
  /** Card effects plus passive costs and reputation decay (applied to the meters). */
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

function scaleGain(value: number, multiplier: number): number {
  return value > 0 ? Math.round(value * multiplier) : value;
}

function scaleLoss(value: number, multiplier: number): number {
  return value < 0 ? Math.round(value * multiplier) : value;
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

/** Journalistieke Droogte: active once enough turns passed without news. */
export function isDroughtActive(turnsWithoutNews: number, balance: BalanceConfig): boolean {
  return turnsWithoutNews >= balance.journalismDrought.afterTurnsWithoutNews;
}

interface ModifiedCard {
  effects: FullEffects;
  adFatigue: boolean;
  echoChamber: boolean;
  journalismDrought: boolean;
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
  const { echoChamber, journalismDrought } = input.balance;
  const frenzy = viralStreak >= echoChamber.streak;
  const drought = isDroughtActive(input.turnsWithoutNews, input.balance);
  const users = frenzy ? scaleGain(effects.users, echoChamber.userGainMultiplier) : effects.users;
  const baseToxicity = drought
    ? scaleGain(effects.toxicity, journalismDrought.viralToxicityMultiplier)
    : effects.toxicity;
  const frenzyToxicity = viralStreak === echoChamber.streak ? echoChamber.toxicity : 0;
  return {
    effects: { ...effects, users, toxicity: baseToxicity + frenzyToxicity },
    adFatigue: false,
    echoChamber: frenzy,
    journalismDrought: drought,
  };
}

function applyCardModifiers(input: CardTurnInput, viralStreak: number): ModifiedCard {
  const effects = toFullEffects(input.card.effects);
  const none = { effects, adFatigue: false, echoChamber: false, journalismDrought: false };
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
  const withCosts = addEffects(cardEffects, phase.passiveCosts);
  const totalEffects = reputationDecay
    ? addEffects(withCosts, { reputation: -balance.reputationDecay.amount })
    : withCosts;

  return {
    cardEffects,
    totalEffects,
    modifiers: {
      adFatigue: modified.adFatigue,
      echoChamber: modified.echoChamber,
      journalismDrought: modified.journalismDrought,
      reputationDecay,
    },
    viralStreak,
    turnsWithoutNews,
  };
}

function clamp(value: number): number {
  return Math.min(METER_MAX, Math.max(METER_MIN, value));
}

/** Applies effects to the meters and hidden Toxicity, clamped to 0–100. */
export function applyEffects(
  current: { meters: Record<MeterKey, number>; toxicity: number },
  effects: FullEffects
): { meters: Record<MeterKey, number>; toxicity: number } {
  return {
    meters: {
      revenue: clamp(current.meters.revenue + effects.revenue),
      users: clamp(current.meters.users + effects.users),
      reputation: clamp(current.meters.reputation + effects.reputation),
    },
    toxicity: clamp(current.toxicity + effects.toxicity),
  };
}
