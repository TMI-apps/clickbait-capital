# Brief — Shuffled hand: three random cards in a random order

Task: player feedback via orchestrator (autopilot hand) · Lap: temp_job_shuffled-hand · Harness: v0.45.0

## Problem

Every hand holds one viral, one ad and one news card in the same slots (viral left, ad middle, news right), so players build muscle memory ("always tap left") instead of reading the cards.

## Success check

Over many seeds, hands hold exactly 3 distinct card ids drawn from the phase's whole pool, with category mixes other than one-of-each (e.g. 3 ads, 2 news + 1 viral) and varying slot order; the same seed + actions replays the same hands; the board renders the hand in drawn order with drag, keyboard and screen-reader still working; the balance assertions (one-sided styles fail for their own reason, human-like / rule-of-thumb / mixed win, event pacing) still hold or are retuned with the change reported.

## In scope

- Engine: `Hand` becomes an ordered list of 3 card ids; `drawHand` draws 3 distinct cards from the phase pool with the seeded RNG; `getHandCards` returns the list in order; `playCard` validates membership.
- Session: hand membership check on a list.
- Board: `toDraft` maps the list in order (no fixed `DRAFT_ORDER`); drought warning per viral card.
- Save: `SAVED_RUN_VERSION` 2 → 3.
- Simulation: strategies pick by preference when their category is missing; before/after numbers.
- Docs: game-engine, game-board, game-content, game-save READMEs, DOC_GAME_DESIGN § 4 Type 1, vision sentence, decision log.

## Out of scope

- Will NOT touch: card texts, event logic, board layout or juice.
- Will NOT do: weighted draws per category or guaranteed category mixes.

## Edges

| Feature area | Loop today | Hook point | Ride / new |
| --- | --- | --- | --- |
| game-engine `gameEngine.ts`, `gameState.types.ts` | one pick per type in fixed order | `drawHand`, `Hand`, `getHandCards` | ride |
| game-session `gameSession.ts` | `Object.values(hand).includes` | membership on a list | ride |
| game-board `boardView.ts` | `DRAFT_ORDER` maps type → card | map the list | ride |
| game-save types | `SAVED_RUN_VERSION = 2` | bump to 3 | ride |
| game-content simulation (+ values only if balance breaks) | strategies pick by type | preference with fallback | ride |
| Test fixtures (session, board, pages, kit gallery comment) | `hand.viral` etc. | `hand[0]` / find by type | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

S — one engine draw, one type change with a handful of consumers, a version bump, simulation strategies.
Cut into laps: none

## Plan (S)

1. Acceptance (failing first): `gameEngine.test.ts` — over 200 seeds every hand has 3 distinct ids from the phase pool, some hands are not one-per-type, the type at slot 0 varies, the same seed draws the same hand.
2. `Hand = readonly string[]`; `drawHand` draws without replacement (`pickRandom` on the remaining pool, so order is random too); throws when the phase pool has fewer than 3 cards.
3. Consumers: `getHandCards` → `CardDefinition[]`; `playCard` / `gameSession` `includes`; `toDraft` maps in order.
4. `SAVED_RUN_VERSION` 3; fixtures.
5. Simulation: choices by card id; one-sided strategies play their type, else a fallback order; before/after; retune only if an assertion breaks.
6. READMEs, design § 4 Type 1, vision, decision log.

Precedent: drafting N cards from one shuffled pool without replacement is the deck-builder default (Slay the Spire card rewards, Reigns-style random draws); no package applies (a few lines on the existing seeded RNG).

## Decisions

DECISIONS.md D1–D5
