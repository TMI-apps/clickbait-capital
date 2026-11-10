import { describe, expect, it } from "vitest";
import type {
  CardDefinition,
  PhaseDefinition,
} from "@/features/game-engine/types/gameContent.types";
import { SEED_CONTENT } from "./seedContent";
import { applyScore, audienceFactor, computeCardTurn, scaleForPhase } from "./turnEffects";

const balance = SEED_CONTENT.balance;
/** Neutral phase so modifier tests read the design numbers directly. */
const NEUTRAL_PHASE: PhaseDefinition = {
  ...SEED_CONTENT.phases[1]!,
  passiveCosts: {},
  reputationLossMultiplier: 1,
  revenueGainMultiplier: 1,
};

const viral: CardDefinition = {
  id: "v",
  type: "viral",
  title: "",
  body: "",
  effects: { users: 10, toxicity: 4 },
};
const ad: CardDefinition = {
  id: "a",
  type: "ad",
  title: "",
  body: "",
  effects: { revenue: 20, users: -3 },
};
const news: CardDefinition = {
  id: "n",
  type: "news",
  title: "",
  body: "",
  effects: { reputation: 8, toxicity: -10 },
};

const base = {
  playedTypes: [],
  viralStreak: 0,
  turnsWithoutNews: 0,
  toxicity: 0,
  phase: NEUTRAL_PHASE,
  balance,
};

describe("computeCardTurn", () => {
  it("should apply the card effects plus news-ignored toxicity when no modifier is active", () => {
    const result = computeCardTurn({ ...base, card: ad });
    expect(result.cardEffects).toEqual({ revenue: 20, users: -3, reputation: 0, toxicity: 2 });
    expect(result.modifiers).toEqual({
      adFatigue: false,
      echoChamber: false,
      journalismDrought: false,
      reputationDecay: false,
    });
  });

  it("should halve revenue and double user loss when 3 of the previous 4 plays were ads", () => {
    const result = computeCardTurn({ ...base, card: ad, playedTypes: ["ad", "news", "ad", "ad"] });
    expect(result.modifiers.adFatigue).toBe(true);
    expect(result.cardEffects.revenue).toBe(10);
    expect(result.cardEffects.users).toBe(-6);
  });

  it("should not fatigue ads when only 2 of the previous 4 plays were ads", () => {
    const result = computeCardTurn({
      ...base,
      card: ad,
      playedTypes: ["ad", "ad", "ad", "news", "viral"],
    });
    expect(result.modifiers.adFatigue).toBe(false);
  });

  it("should add 50% users and +25 toxicity when the third viral in a row is played", () => {
    const result = computeCardTurn({
      ...base,
      card: viral,
      viralStreak: 2,
      playedTypes: ["viral", "viral"],
    });
    expect(result.modifiers.echoChamber).toBe(true);
    expect(result.cardEffects.users).toBe(15);
    expect(result.cardEffects.toxicity).toBe(4 + 2 + 25);
    expect(result.viralStreak).toBe(3);
  });

  it("should keep the user bonus but not repeat the +25 toxicity when the viral streak continues", () => {
    const result = computeCardTurn({ ...base, card: viral, viralStreak: 3 });
    expect(result.cardEffects.users).toBe(15);
    expect(result.cardEffects.toxicity).toBe(6);
  });

  it("should double viral toxicity when 5 turns passed without news", () => {
    const result = computeCardTurn({ ...base, card: viral, turnsWithoutNews: 5 });
    expect(result.modifiers.journalismDrought).toBe(true);
    expect(result.cardEffects.toxicity).toBe(8 + 2);
  });

  it("should not flag drought when only 4 turns passed without news", () => {
    const result = computeCardTurn({ ...base, card: viral, turnsWithoutNews: 4 });
    expect(result.modifiers.journalismDrought).toBe(false);
    expect(result.cardEffects.toxicity).toBe(4 + 2);
  });

  it("should scale reputation decay by the phase loss multiplier", () => {
    const phase = { ...NEUTRAL_PHASE, reputationLossMultiplier: 3 };
    const result = computeCardTurn({ ...base, card: ad, turnsWithoutNews: 2, phase });
    expect(result.totalEffects.reputation).toBe(-9);
  });

  it("should take 3 reputation per turn when the decay threshold of turns without news is reached", () => {
    const result = computeCardTurn({ ...base, card: ad, turnsWithoutNews: 2 });
    expect(result.turnsWithoutNews).toBe(3);
    expect(result.modifiers.reputationDecay).toBe(true);
    expect(result.totalEffects.reputation).toBe(-3);
    expect(result.cardEffects.reputation).toBe(0);
  });

  it("should reset the news counter and viral streak when news is played", () => {
    const result = computeCardTurn({ ...base, card: news, turnsWithoutNews: 4, viralStreak: 2 });
    expect(result.turnsWithoutNews).toBe(0);
    expect(result.viralStreak).toBe(0);
    expect(result.modifiers.reputationDecay).toBe(false);
    expect(result.cardEffects).toEqual({ revenue: 0, users: 0, reputation: 8, toxicity: -10 });
  });

  it("should not drain reputation when toxicity is at or below the drain level", () => {
    const result = computeCardTurn({ ...base, card: ad, toxicity: balance.toxicityDrain.from });
    expect(result.totalEffects.reputation).toBe(0);
  });

  it("should drain reputation by the toxicity above the drain level", () => {
    const result = computeCardTurn({ ...base, card: ad, toxicity: 60 });
    const { from, perPoint } = balance.toxicityDrain;
    expect(result.totalEffects.reputation).toBe(-Math.round((60 - from) * perPoint));
    expect(result.cardEffects.reputation).toBe(0);
  });

  it("should add the phase passive costs to the total but not to the card effects", () => {
    const phase = { ...NEUTRAL_PHASE, passiveCosts: { revenue: -4 } };
    const result = computeCardTurn({ ...base, card: news, phase });
    expect(result.totalEffects.revenue).toBe(-4);
    expect(result.cardEffects.revenue).toBe(0);
  });
});

describe("scaleForPhase", () => {
  it("should scale reputation loss and revenue gain by the phase multipliers", () => {
    const phase = { ...NEUTRAL_PHASE, reputationLossMultiplier: 3, revenueGainMultiplier: 0.5 };
    expect(scaleForPhase({ revenue: 15, reputation: -5, users: 2 }, phase)).toEqual({
      revenue: 8,
      reputation: -15,
      users: 2,
      toxicity: 0,
    });
  });

  it("should round scaled losses and gains alike when the product ends in .5", () => {
    const phase = { ...NEUTRAL_PHASE, reputationLossMultiplier: 0.5, revenueGainMultiplier: 0.5 };
    expect(scaleForPhase({ revenue: 5, reputation: -5 }, phase)).toMatchObject({
      revenue: 3,
      reputation: -3,
    });
    const tiny = scaleForPhase({ reputation: -1 }, { ...phase, reputationLossMultiplier: 0.4 });
    expect(Object.is(tiny.reputation, -0)).toBe(false);
  });

  it("should leave reputation gain and revenue loss unscaled", () => {
    const phase = { ...NEUTRAL_PHASE, reputationLossMultiplier: 3, revenueGainMultiplier: 0.5 };
    expect(scaleForPhase({ revenue: -10, reputation: 5 }, phase)).toMatchObject({
      revenue: -10,
      reputation: 5,
    });
  });
});

describe("applyScore", () => {
  const phase = NEUTRAL_PHASE;
  const { userLossPerPoint } = balance;
  const atFullAudience = { users: phase.audienceUsers, money: 100, reputation: 50, toxicity: 98 };

  it("should land users and money points on the score at the phase rates", () => {
    const result = applyScore(
      atFullAudience,
      { revenue: 3, users: 2, reputation: 0, toxicity: 0 },
      { phase, userLossPerPoint }
    );
    expect(result.delta).toEqual({
      users: 2 * phase.usersPerPoint,
      money: 3 * phase.moneyPerPoint,
    });
    expect(result.users).toBe(phase.audienceUsers + 2 * phase.usersPerPoint);
    expect(result.money).toBe(100 + 3 * phase.moneyPerPoint);
  });

  it("should scale a money gain by the audience but take costs in full", () => {
    const half = { ...atFullAudience, users: phase.audienceUsers / 2 };
    const total = { revenue: 6, users: 0, reputation: 0, toxicity: 0 };
    const gain = { revenue: 10, users: 0, reputation: 0, toxicity: 0 };
    const result = applyScore(half, total, { phase, userLossPerPoint, gainEffects: gain });
    expect(result.delta.money).toBe(10 * phase.moneyPerPoint * 0.5 - 4 * phase.moneyPerPoint);
  });

  it("should take a users loss as a share of the current users per point", () => {
    const result = applyScore(
      { users: 100_000, money: 0, reputation: 50, toxicity: 0 },
      { revenue: 0, users: -5, reputation: 0, toxicity: 0 },
      { phase, userLossPerPoint }
    );
    expect(result.delta.users).toBe(-Math.round(100_000 * 5 * userLossPerPoint));
  });

  it("should never take users below 0 and clamp reputation and toxicity to 0–100", () => {
    const result = applyScore(
      { users: 10, money: 0, reputation: 50, toxicity: 98 },
      { revenue: 0, users: -1_000, reputation: 60, toxicity: 10 },
      { phase, userLossPerPoint }
    );
    expect(result).toMatchObject({ users: 0, reputation: 100, toxicity: 100 });
    expect(result.delta.users).toBe(-10);
  });

  it("should let money fall below 0 when costs exceed it", () => {
    const result = applyScore(
      { ...atFullAudience, money: 10 },
      { revenue: -1, users: 0, reputation: 0, toxicity: 0 },
      { phase, userLossPerPoint }
    );
    expect(result.money).toBe(10 - phase.moneyPerPoint);
  });
});

describe("audienceFactor", () => {
  it("should be users / audienceUsers between 0 and 1.5", () => {
    const phase = NEUTRAL_PHASE;
    expect(audienceFactor(0, phase)).toBe(0);
    expect(audienceFactor(phase.audienceUsers / 4, phase)).toBe(0.25);
    expect(audienceFactor(phase.audienceUsers * 5, phase)).toBe(1.5);
  });

  it("should throw when the phase has no positive audience", () => {
    expect(() => audienceFactor(1, { ...NEUTRAL_PHASE, audienceUsers: 0 })).toThrow();
  });
});
