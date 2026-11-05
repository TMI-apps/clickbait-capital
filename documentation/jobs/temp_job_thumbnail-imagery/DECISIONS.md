# Decisions — thumbnail-imagery

Job: `temp_job_thumbnail-imagery`
Updated: 2026-11-05

## Closed

| id  | topic | status | choice | source | notes |
| --- | ----- | ------ | ------ | ------ | ----- |
| D1  | Image source | closed | Free stock photos with a free licence + code-drawn effects; no AI, no paid services | owner (via orchestrator) | — |
| D2  | Where the treatment lives | closed | Kit component `ThumbnailFrame` in `components/common/`, used by `GameCardArtwork`; data rides on `GameCardImage.thumbnail` | loop-plan | lost: overlay in card-imagery (GameCard would need a render slot; kit stays the only place that draws cards) |
| D3  | Treatment data | closed | Per-entry `thumbnail` in the image manifest (`caption?`, `sticker?`, `marker?: { shape, x, y }`); none hard-coded per card | owner brief | — |
| D4  | Photo index | closed | Openverse (CC0 + CC BY 2.0–4.0; Flickr, StockSnap, WordPress, rawpixel) | loop-plan | Pexels/Unsplash sites and APIs are blocked or key-only from the sandbox; Openverse is the index the first imagery lap used |
| D5  | People rules | closed | Adults only; no captions that put words in a person's mouth (no quotes, no "I…" captions); captions name the topic | owner brief | — |
| D6  | Motion | closed | Static overlay, no animation | loop-plan | satisfies reduced motion without a branch; card draw/play motion stays |

## Open

| id  | topic | status | options briefly | blocked phase |
| --- | ----- | ------ | --------------- | ------------- |
| O1  | Final card id list | open | from kids-content lap PR (orchestrator sends) | Phase 4 |

## Log

- 2026-11-05 — D1–D6 closed
