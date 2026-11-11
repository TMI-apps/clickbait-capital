import type {
  CardDefinition,
  CardType,
  GameContent,
  HandMixConfig,
  PhaseId,
} from "@/features/game-engine/types/gameContent.types";
import type { DrawDeck, Hand } from "@/features/game-engine/types/gameState.types";
import { nextRandom, pickRandom } from "@/shared/utils/seededRandom";

/**
 * The draw deck (deck-draw D1–D4): one seeded draw pile per card type for the current phase,
 * top first. Every card a hand shows goes to the bottom of its pile, played or not, so a card
 * comes back only after the rest of its type's pile has been shown. The hand's type mix is one
 * roll on the balance's `handMix` table (one of each, a pair plus one, three of one type).
 */

/** Cards in every draft (design § 4 Type 1). */
export const HAND_SIZE = 3;

/** The card types, in a fixed order so draws replay per seed. */
const CARD_TYPES: readonly CardType[] = ["viral", "ad", "news"];

type Piles = Record<CardType, string[]>;

/** Where a draw starts: the phase, the deck so far (null before the first hand) and the RNG. */
export interface DrawOptions {
  phase: PhaseId;
  deck: DrawDeck | null;
  rngState: number;
}

interface Draw<T> {
  value: T;
  rngState: number;
}

function cardsFor(content: GameContent, phase: PhaseId): CardDefinition[] {
  return content.cards.filter((card) => card.phases?.includes(phase) ?? true);
}

/** Fisher–Yates on the run RNG. */
function shuffle<T>(items: readonly T[], rngState: number): Draw<T[]> {
  const result = [...items];
  let state = rngState;
  for (let index = result.length - 1; index > 0; index--) {
    const step = nextRandom(state);
    state = step.state;
    const swap = Math.floor(step.value * (index + 1));
    [result[index], result[swap]] = [result[swap] as T, result[index] as T];
  }
  return { value: result, rngState: state };
}

/**
 * Piles for a phase (deck-draw D3): cards new to the deck go on top in a seeded shuffle; cards
 * the previous phase's piles already held keep their order below them, so what was just shown
 * stays at the bottom across a phase change.
 */
function pilesForPhase(
  content: GameContent,
  { phase, deck: previous, rngState }: DrawOptions
): Draw<Piles> {
  const pool = cardsFor(content, phase);
  let state = rngState;
  const piles = {} as Piles;
  for (const type of CARD_TYPES) {
    const ids = new Set(pool.filter((card) => card.type === type).map((card) => card.id));
    const kept = (previous?.piles[type] ?? []).filter((id) => ids.has(id));
    const fresh = shuffle(
      [...ids].filter((id) => !kept.includes(id)),
      state
    );
    state = fresh.rngState;
    piles[type] = [...fresh.value, ...kept];
  }
  return { value: piles, rngState: state };
}

/** The deck for `phase`: the current one, or new piles after a phase change or at the start. */
function deckFor(content: GameContent, options: DrawOptions): Draw<DrawDeck> {
  const { phase, deck, rngState } = options;
  if (deck?.phase === phase) {
    return { value: deck, rngState };
  }
  const piles = pilesForPhase(content, options);
  return {
    value: { phase, piles: piles.value, lastHand: deck?.lastHand ?? [] },
    rngState: piles.rngState,
  };
}

/**
 * The types of the three slots, in slot order (deck-draw D2): one roll on `handMix` picks one
 * of each, a pair plus one other, or three of one type; which types and their order are seeded.
 */
export function rollHandTypes(mix: HandMixConfig, rngState: number): Draw<CardType[]> {
  const roll = nextRandom(rngState);
  const total = mix.oneOfEach + mix.pair + mix.triple;
  const at = roll.value * total;
  const first = pickRandom(CARD_TYPES, roll.state);
  let types: CardType[];
  let state = first.state;
  if (at < mix.oneOfEach) {
    types = [...CARD_TYPES];
  } else if (at < mix.oneOfEach + mix.pair) {
    const other = pickRandom(
      CARD_TYPES.filter((type) => type !== first.item),
      state
    );
    state = other.state;
    types = [first.item, first.item, other.item];
  } else {
    types = [first.item, first.item, first.item];
  }
  const order = shuffle(types, state);
  return { value: order.value, rngState: order.rngState };
}

/** The top card of the type's pile that may be shown: not in the last hand nor this one. */
function topEligible(piles: Piles, type: CardType, blocked: ReadonlySet<string>): string | null {
  return piles[type].find((id) => !blocked.has(id)) ?? null;
}

/**
 * A slot's type when its rolled type has no card left to show (small pool): the first type in
 * fixed order that has one, preferring a type the hand doesn't hold yet.
 */
function fallbackType(piles: Piles, blocked: ReadonlySet<string>, inHand: CardType[]): CardType {
  const open = CARD_TYPES.filter((type) => topEligible(piles, type, blocked) !== null);
  return open.find((type) => !inHand.includes(type)) ?? (open[0] as CardType);
}

/** Moves `id` from wherever it is in its pile to the bottom. */
function toBottom(piles: Piles, type: CardType, id: string): Piles {
  return { ...piles, [type]: [...piles[type].filter((other) => other !== id), id] };
}

/** Cards not in the last hand are enough for a hand: the last hand is held back (D4). */
function blockedBy(deck: DrawDeck, poolSize: number): Set<string> {
  return poolSize - deck.lastHand.length >= HAND_SIZE ? new Set(deck.lastHand) : new Set();
}

/** Takes one card per slot type from the top of its pile and puts it at the bottom. */
function takeCards(
  deck: DrawDeck,
  slotTypes: readonly CardType[],
  poolSize: number
): { hand: string[]; piles: Piles } {
  const blocked = blockedBy(deck, poolSize);
  let piles = deck.piles;
  const hand: string[] = [];
  const handTypes: CardType[] = [];
  for (const rolled of slotTypes) {
    const type =
      topEligible(piles, rolled, blocked) === null
        ? fallbackType(piles, blocked, handTypes)
        : rolled;
    const id = topEligible(piles, type, blocked) as string;
    hand.push(id);
    handTypes.push(type);
    blocked.add(id);
    piles = toBottom(piles, type, id);
  }
  return { hand, piles };
}

/**
 * Draws `HAND_SIZE` different cards in slot order (deck-draw D1–D4; replaces shuffled-hand D1
 * and balance-cleanup D2): the hand's types come from one `handMix` roll, each slot takes the
 * top card of its type's pile, and every shown card goes to the bottom of its pile. The last
 * hand is never shown again in the next one. Pure: returns the new deck and RNG state.
 */
export function drawHand(
  content: GameContent,
  options: DrawOptions
): { hand: Hand; deck: DrawDeck; rngState: number } {
  const poolSize = cardsFor(content, options.phase).length;
  if (poolSize < HAND_SIZE) {
    throw new Error(`game-engine: phase ${options.phase} has fewer than ${HAND_SIZE} cards`);
  }
  const deck = deckFor(content, options);
  const slots = rollHandTypes(content.balance.handMix, deck.rngState);
  const { hand, piles } = takeCards(deck.value, slots.value, poolSize);
  return {
    hand,
    deck: { phase: options.phase, piles, lastHand: hand },
    rngState: slots.rngState,
  };
}
