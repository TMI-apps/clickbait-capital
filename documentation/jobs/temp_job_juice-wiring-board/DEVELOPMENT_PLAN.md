# Development plan — juice-wiring-board (lap 3 of 4)

Brief: `BRIEF.md` · Decisions: `DECISIONS.md` D1–D8 · Size M

## Acceptance test

Unit and hook tests that fail before the build and pass after:
- `boardJuice.test.ts`: scandal hit replaces the event sting; tiles carry their change text; `meterMoments` edges; scandal level buckets and ramp.
- `useBoardJuice.test.ts`: goal edge with the reveal; scandal ramp quiet at mount and stopped by tag; comment arrivals quiet at mount.
- `useCardForecast.test.ts`: one lift per pickup (a hold that becomes a drag lifts once); over the feed; cancel vs play.
- `inspectorSamples.test.ts`: every new recipe target has a mock anchor.
- `gameJuiceRecipes.test.ts`: the new recipes keep the effect, sound, range and budget rules.

## Phases

1. **Sounds.** Cherry-pick `assets/juice-sounds`, add 6 ids and seeds (own generator and date) to game-audio. Gate: the manifest test covers every id.
2. **Catalog and recipes.** 9 events, floaters on `meter.changed`, `SCANDAL_WARNING_TAG`. Gate: the recipe test.
3. **Board wiring.**
   - `useCardForecast` emits the drag's moments (`cardElement` and `feedId` passed in, so the hook imports no component).
   - `useBoardReveal` adds the goal / danger edges.
   - `useScandalWarningJuice` and `useCommentArrivals` are new.
   - `juiceForLastStep` passes `openedScandal` and `deltaText`.
   - New anchors: `feed:drop`, and `comment:latest` via `PostComments` `latestRef`.

   Gate: board tests.
4. **Inspector.** New anchors on the mock board, plus a `goal.reached` sample. Gate: the samples test.
5. **Docs.** game-juice, game-board, follower-comments, juice-inspector and game-audio READMEs; decision log.

## Pattern & precedent

- **Floating combat-text numbers:** a common way to make a change legible at the spot it happens (Clash Royale damage, Balatro chips).
- **Edge-triggered milestone stings:** play on crossing, never while a value stays over the line.
- **Escalating warnings in steps, not loops:** loops for kids distract and are an accessibility risk.

All of it rides the juice-core recipe system. No new mechanism.

## Plan review

Folded into the loop-check review of the built diff. The lap re-uses lap 1–2 mechanisms only; the open questions were placement (`useCardForecast` owns drag state, so it owns the drag juice) and timing (edges from the shown tiles, D1).

## Verification

- Vitest; type-check; lint (no new warnings); arch; structure; feature size; feature docs (strict); bundle (initial JS 139.8 KiB ≤ 150).
- Playwright against `vite preview` with an `Element.animate` and stage-text recorder, at 390×844, 1440×900 and 390×844 with reduced motion. Each pass drags, cancels, then plays to a scandal.
