import { describe, expect, it } from "vitest";
import type {
  CardDefinition,
  PhaseDefinition,
} from "@/features/game-engine/types/gameContent.types";
import { SEED_CONTENT } from "./seedContent";
import { applyEffects, computeCardTurn, scaleForPhase } from "./turnEffects";

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

describe("applyEffects", () => {
  it("should clamp meters and toxicity to 0–100", () => {
    const result = applyEffects(
      { meters: { revenue: 95, users: 3, reputation: 50 }, toxicity: 98 },
      { revenue: 10, users: -10, reputation: 0, toxicity: 10 }
    );
    expect(result).toEqual({ meters: { revenue: 100, users: 0, reputation: 50 }, toxicity: 100 });
  });
});
