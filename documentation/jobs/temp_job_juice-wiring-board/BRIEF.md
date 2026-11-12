# Brief — Game juice system (lap 3 of 4: wire juice into the board's moments)

Task: Full game juice system (orchestrator backlog) · Lap: temp_job_juice-wiring-board · Harness: v0.45.0 · Previous laps: juice-core (#61), juice-migrate (#62)

## Problem

The board's existing feedback now runs on juice events, but most moment-to-moment play has no feedback at all:
- picking up, holding, dragging over the feed, dropping or cancelling a card;
- the forecast on the chart;
- comments arriving;
- the size of each number change;
- reaching a goal line, money running low;
- the scandal warning and the scandal itself.

## Success check

On `/spel`, each of these moments plays its own recipe:
- picking up / holding a card;
- dragging it over the feed and cancelling a drag;
- the chart forecast appearing;
- each comment arriving;
- each number change rising as a floater ("+€ 2.000");
- crossing a goal line ("Doel gehaald!");
- money entering the danger zone;
- the scandal warning appearing or rising a level;
- a scandal hitting.

None of them fire for a resumed run, and news / journalism stay dull. Each is triggerable and tunable in `/juice`.

## In scope

- **New catalog events and recipes:**

  | Event | Variants / vars |
  |---|---|
  | `card.pickup` | variant = card type |
  | `card.over-feed` | — |
  | `card.cancel` | — |
  | `forecast.shown` | — |
  | `comment.arrived` | — |
  | `goal.reached` | `vars.meter` |
  | `money.danger` | — |
  | `scandal.warning` | variant = level 1–3; tag `scandal-warning`, stopped when the warning goes away |
  | `scandal.hit` | replaces `event.appeared` when the new event is a scandal |

  `meter.changed` gain/loss gain floaters with the tile's change text (`vars.text`).
- **Board wiring:**
  - drag start / cancel and hold start in `PlayingBoard` / `CardDraft` handlers;
  - drop slot `over` in `PhoneFeed`;
  - forecast changes in `PlayingBoard`;
  - comment reveal count in `PhoneFeed`;
  - meter edges (goal reached, money danger) from the shown meters in `useBoardReveal`;
  - scandal level edges in a board hook;
  - scandal hit in `juiceForAction`.
- **Anchors:** `feed:drop`, `comment:latest` (via an optional ref prop on follower-comments `PostComments`), plus the existing `chart` and `scandal`.
- **Sounds:**
  - New ids: `card-pickup`, `comment-pop`, `goal-reached`, `money-danger`, `scandal-warning`, `scandal-hit`.
  - The orchestrator is generating them; the list was sent.
  - Until the files arrive, recipes use existing sounds with pitch / volume variation. Swapping in a new sound is a one-line recipe edit plus a manifest entry. If the files arrive during this lap, they land in this lap.
- **Inspector:** sample payloads and the mock board's anchors for the new events.

## Out of scope

- Will NOT do (lap 4): phase intro, buttons / navigation everywhere, how-to-play, sharing, results, the "Trillen" setting, the rule pointer.
- Will NOT touch: game rules, the chart's drawing, comment content, the card kit's own CSS hover / press styles.

## Edges

| Feature area | Hook point | Ride / new |
|---|---|---|
| `game-board` | handlers, `useBoardReveal`, `juiceForAction`, `PhoneFeed`, `MeterPanel` (anchors exist) | ride |
| `game-juice` | catalog, recipes | ride |
| `follower-comments` | `PostComments` optional `latestRef` | ride (presentational prop) |
| `game-audio` | 6 new sound ids + manifest (when files arrive) | ride |
| `juice-inspector` | samples, mock anchors | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M. Mostly additive recipe data and small emit points; one pure function (meter / scandal edges) with tests.

## Decisions

`DECISIONS.md` D1–D7.
