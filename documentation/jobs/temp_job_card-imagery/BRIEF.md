# Brief — Card imagery with license manifest and credits

Task: Card imagery with license manifest and credits · Lap: temp_job_card-imagery · Branch: feat/card-imagery (orchestrated thread)

## Problem
The 54 cards and 13 events have image hints but no pictures; the board shows type-icon fallbacks, and there is no place that credits third-party assets.

## Success check
Every one of the 67 content ids (54 cards + 13 events) resolves through `getCardImage(id)` to a WebP in `public/cards/` that exists on disk, with a manifest entry carrying source URL, author, license (+ URL) and credit text, and `/credits` lists every image credit plus the audio credit.

## In scope
- Sourcing: Openverse (CC0 / CC-BY photographs, Flickr + Wikimedia Commons sources); reject faces, brands/logos, unclear licenses. Downloaded once by the agent, cropped 4:3, 640×480 WebP in `public/cards/<id>.webp`. Never hotlinked.
- New feature `src/features/card-imagery/`: manifest data, lookup `getCardImage(id) → { src, alt, focalPoint, width, height }`, credits list component, README.
- `/credits` page (`src/pages/CreditsPage.tsx`) + one lazy route in `src/App.tsx`, using `UI_COPY.credits` and the game-audio credit.

## Out of scope
- Will NOT touch: `src/features/game-board/`, `game-engine/`, `src/components/common/` (GameCard already does lazy loading, 4:3 cover crop and focal point), `src/config/app-tasks.json`.
- Will NOT do: wiring images into the board (follow-up for the board thread); Unsplash/Pexels (not needed: Openverse covers the set, no key).
- Will NOT do: srcset — one 640px master covers the card's on-screen width at 2× DPR.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| card-imagery | Not found | `api/index.ts` lookup + credits component | new — provenance of third-party images is its own concept (licenses, credits), not game copy |
| game-content | ids + `imageAlt` hints | read ids via its api barrel (test: every id has an image) | ride |
| game-audio | `AUDIO_CREDIT_LINE` | read via its api barrel on `/credits` | ride |
| pages + App routes | no credits page | `src/pages/CreditsPage.tsx`, lazy route `/credits` | new |
| public/cards | whitelisted, empty | 67 WebP files | new |

## Size
M — new feature, 67 sourced assets, one page + route.

## Decisions
DECISIONS.md rows D1–D8 (copied to `documentation/DOC_DECISION_LOG.md` § card-imagery).
