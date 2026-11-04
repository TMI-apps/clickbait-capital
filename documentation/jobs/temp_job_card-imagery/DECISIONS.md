# DECISIONS — card-imagery

Plan: size M without a `DEVELOPMENT_PLAN.md`. The plan step was skipped because the orchestrator brief came before the check-loop-artifacts rule (orchestrator-artifact-check D1); the plan lived in BRIEF.md § In scope.

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Where the manifest lives | closed | New feature `src/features/card-imagery/` (manifest, lookup, credit list), not `game-content` | loop-refine | clear-winner: license provenance and credits are their own concept; game-content stays rules plus copy |
| D2 | Alt text | closed | Dutch alt per real photo in the manifest; game-content `imageAlt` stays a sourcing hint | loop-refine | clear-winner: `imageAlt` describes an imagined illustration, not the photo |
| D3 | Formats and sizes | closed | One 640×480 WebP per id (quality 68), no AVIF, no srcset | loop-plan | clear-winner: covers the card width at 2× DPR; 2.1 MB for 67; AVIF would double the files for a few KB each |
| D4 | Source | closed | Openverse only (CC0 / CC BY, photographs, anonymous, no key); Unsplash/Pexels not needed | loop-build | owner's order: Openverse/Commons first; it covered all 67 ids |
| D5 | Rejection rules | closed | Reject people (faces, minors), recognizable venues, brands or logos, copyrighted artworks or game art, unclear licenses; visual check on contact sheets | owner sourcing rules + orchestrator review | the review replaced three images (a child with a test, a recognizable stadium, an unrelated chart) |
| D6 | Credits | closed | `/credits` page lists every photo in TASL format (title links to the source, author, license links to the deed); CC0 credited too; audio credit from game-audio | loop-refine | clear-winner: CC BY requires attribution; one list for every photo is simpler than two |
| D7 | Board wiring | closed | Not in this lap; the board passes `getCardImage(card.id) ?? undefined` to GameCard in a follow-up | orchestrator | the game-board thread owned `src/features/game-board/` during this lap |
| D8 | Photos vs illustrations | closed | Free photos of an object that stands for the card, matching the content's illustration themes loosely | loop-build | generating an illustration set needs the owner's call on cost and style; noted for a later task |
