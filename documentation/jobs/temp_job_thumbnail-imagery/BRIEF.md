# Brief — Juicy thumbnail card imagery

Task: owner request via orchestrator (card images too neutral → YouTube-thumbnail style) · Lap: temp_job_thumbnail-imagery · Harness: v0.45.0

## Problem
The card photos are calm object shots; 11-year-olds read the cards as dull, and the game's point (clickbait wins attention) is not felt in the imagery.

## Success check
Every card and event id in the final deck has a manifest entry with a free-licence expressive-face photo (licence fields complete, file present, < 150 KB), and the GameCard draws a code-rendered thumbnail treatment (on viral/ad/event only: boosted colour, type-coloured glow, optional arrow/circle, emoji sticker, 1–3 word caption) from that entry's data; unknown ids still show the clean type-icon placeholder.

## In scope
- `ThumbnailFrame` kit component (`src/components/common/ThumbnailFrame/`): presentation-only overlay over any image — saturate/contrast boost, thick type-accent outline + glow, optional marker (arrow / circle at a point), optional emoji sticker, optional caption. Static (no animation), overlay `aria-hidden`, alt stays on the `<img>`.
- `GameCardImage.thumbnail?` (data) → `GameCardArtwork` wraps the photo in `ThumbnailFrame` with the card type as accent.
- Manifest field `thumbnail` per entry; `getCardImage` passes it through.
- New photos: adults with strong expressions (shock, joy, anger, disbelief, cringe), CC0 or CC BY (attribution kept) via Openverse; WebP 640×480 as today; manifest + `/credits` complete.
- Final deck: cover exactly the ids of the kids-content lap once the orchestrator sends them.

## Out of scope
- Will NOT do: AI generation, paid services, Pexels/Unsplash (blocked from the sandbox; Openverse CC0/CC BY covers the owner's licence ask).
- Will NOT do: animated thumbnails (reduced motion is trivially respected).
- Will NOT touch: card copy/effects (kids-content lap), GameCard layout, credits page structure, `app-tasks*.json`.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| components/common/GameCard | `image` prop → `GameCardArtwork` → `<img>` / fallback | `GameCardImage.thumbnail`, artwork wraps in ThumbnailFrame | ride |
| components/common/ThumbnailFrame | Not found | new kit component | new — generic overlay, reusable (share card, credits) |
| card-imagery | manifest → `getCardImage` → board | manifest `thumbnail`, new files | ride |
| game-board | tap → play; info button → details | `CardDraft` tap → details, `PlayingBoard` focus return | ride — owner D9 (info button covered the thumbnail) |
| theme tokens | `base.tokens.json` | `thumbnail-*` colour tokens | ride |
| docs | DOC_DECISION_LOG.md, card-imagery README | § thumbnail-imagery | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size
M — two kit edges + data/asset replacement of ~70 photos + a dependency on the parallel content lap's final id list.
Cut into laps: none

## Decisions
DECISIONS.md D1…D6
