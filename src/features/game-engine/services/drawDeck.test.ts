import { describe, expect, it } from "vitest";
import type {
  CardDefinition,
  CardType,
  GameContent,
  PhaseId,
} from "@/features/game-engine/types/gameContent.types";
import type { DrawDeck } from "@/features/game-engine/types/gameState.types";
import { drawHand, rollHandTypes } from "./drawDeck";
import { SEED_CONTENT } from "./seedContent";

const SEEDS = Array.from({ length: 200 }, (_, index) => index * 7919 + 13);

/** Seed content with `perType` cards of each type in every phase (the full deck holds 11–12). */
function deckOf(perType: number): GameContent {
  const cards: CardDefinition[] = (["viral", "ad", "news"] as const).flatMap((type) => {
    const template = SEED_CONTENT.cards.find((card) => card.type === type)!;
    return Array.from({ length: perType }, (_, index) => ({
      ...template,
      id: `${type}-${index}`,
      phases: undefined,
    }));
  });
  return { ...SEED_CONTENT, cards };
}

const typeOf = (content: GameContent, id: string): CardType =>
  content.cards.find((card) => card.id === id)!.type;

/** Draws `count` hands in a row, as the engine does turn after turn. */
function drawHands(
  content: GameContent,
  options: { seed: number; count: number; phases?: (index: number) => PhaseId }
): string[][] {
  let deck: DrawDeck | null = null;
  let rngState = options.seed;
  const hands: string[][] = [];
  for (let index = 0; index < options.count; index++) {
    const phase = options.phases?.(index) ?? 1;
    const draw = drawHand(content, { phase, deck, rngState });
    deck = draw.deck;
    rngState = draw.rngState;
    hands.push([...draw.hand]);
  }
  return hands;
}

/** Fewest hands between two showings of the same card, over a run of hands. */
function minRepeatGap(hands: string[][]): number {
  const lastSeen = new Map<string, number>();
  let gap = Infinity;
  hands.forEach((hand, index) => {
    for (const id of hand) {
      const seen = lastSeen.get(id);
      if (seen !== undefined) gap = Math.min(gap, index - seen);
      lastSeen.set(id, index);
    }
  });
  return gap;
}

type Mix = "oneOfEach" | "pair" | "triple";
const mixOf = (types: readonly CardType[]): Mix =>
  (["triple", "pair", "oneOfEach"] as const)[new Set(types).size - 1]!;

describe("rollHandTypes", () => {
  const rolls = SEEDS.flatMap((seed) =>
    Array.from(
      { length: 25 },
      (_, index) => rollHandTypes(SEED_CONTENT.balance.handMix, seed + index * 104_729).value
    )
  );

  it("should roll one of each about 60 %, a pair about 35 % and a triple about 5 % when many hands are rolled", () => {
    const share = (mix: Mix): number =>
      rolls.filter((types) => mixOf(types) === mix).length / rolls.length;
    expect(share("oneOfEach")).toBeGreaterThan(0.57);
    expect(share("oneOfEach")).toBeLessThan(0.63);
    expect(share("pair")).toBeGreaterThan(0.32);
    expect(share("pair")).toBeLessThan(0.38);
    expect(share("triple")).toBeGreaterThan(0.035);
    expect(share("triple")).toBeLessThan(0.065);
  });

  it("should give every type about a third of the slots and every slot any type when many hands are rolled", () => {
    const slots = rolls.flat();
    for (const type of ["viral", "ad", "news"] as const) {
      const share = slots.filter((slot) => slot === type).length / slots.length;
      expect(share).toBeGreaterThan(0.31);
      expect(share).toBeLessThan(0.36);
    }
    for (const slot of [0, 1, 2]) {
      expect([...new Set(rolls.map((types) => types[slot]))].sort()).toEqual([
        "ad",
        "news",
        "viral",
      ]);
    }
  });
});

describe("drawHand", () => {
  const full = deckOf(12);

  it("should draw three different cards of the phase when a hand is drawn", () => {
    for (const seed of SEEDS) {
      const { hand } = drawHand(SEED_CONTENT, { phase: 1, deck: null, rngState: seed });
      expect(new Set(hand).size).toBe(3);
    }
  });

  it("should draw the same hands when the seed is the same", () => {
    expect(drawHands(full, { seed: 42, count: 30 })).toEqual(
      drawHands(full, { seed: 42, count: 30 })
    );
  });

  it("should put every shown card at the bottom of its pile when a hand is drawn", () => {
    const first = drawHand(full, { phase: 1, deck: null, rngState: 7 });
    const second = drawHand(full, { phase: 1, deck: first.deck, rngState: first.rngState });
    for (const id of second.hand) {
      const pile = second.deck.piles[typeOf(full, id)];
      expect(pile.indexOf(id)).toBeGreaterThanOrEqual(pile.length - 3);
    }
    expect(second.deck.lastHand).toEqual(second.hand);
  });

  it("should never show a card again within 4 hands when each type holds 12 cards", () => {
    for (const seed of SEEDS) {
      expect(minRepeatGap(drawHands(full, { seed, count: 60 }))).toBeGreaterThanOrEqual(4);
    }
  });

  it("should never show a card in two hands in a row when the pool holds only two cards per type", () => {
    for (const seed of SEEDS) {
      expect(minRepeatGap(drawHands(SEED_CONTENT, { seed, count: 30 }))).toBeGreaterThanOrEqual(2);
    }
  });

  it("should keep the last hand out of the first hand of the next phase when the phase changes", () => {
    for (const seed of SEEDS) {
      const hands = drawHands(SEED_CONTENT, {
        seed,
        count: 8,
        phases: (index) => (index < 4 ? 1 : 2),
      });
      expect(minRepeatGap(hands)).toBeGreaterThanOrEqual(2);
    }
  });

  it("should draw only from the other types when the phase has no card of one type", () => {
    const content: GameContent = {
      ...full,
      cards: full.cards.filter((card) => card.type !== "news"),
    };
    const types = new Set(
      drawHands(content, { seed: 3, count: 40 })
        .flat()
        .map((id) => typeOf(content, id))
    );
    expect([...types].sort()).toEqual(["ad", "viral"]);
  });

  it("should throw when the phase has fewer than three cards", () => {
    const content: GameContent = { ...SEED_CONTENT, cards: SEED_CONTENT.cards.slice(0, 2) };
    expect(() => drawHand(content, { phase: 1, deck: null, rngState: 1 })).toThrow();
  });
});
