# Brief — Owner photos for every card

Task: owner request via orchestrator (sheet assigning a photo to every card and event) · Lap: temp_job_owner-photos · Branch: feat/owner-photos

## Problem

The deck mixes owner photos, agent-sourced fallbacks and 19 type-icon placeholders. The owner has now picked a photo for every one of the 87 card and event ids and wants exactly those, with the maker credited on /credits.

## Success check

Every card and event id has a manifest entry with the owner's photo (640×480 WebP < 150 KB, file present, no unused files), maker + licence (+ Unsplash photo page) recorded, `PLACEHOLDER_IDS` empty; /credits lists each distinct photo once with the maker's name; ad-lootbox and news-lootbox-onderzoek say "loot box" with a glossary entry; no-trademark test green.

## In scope

- Crop/convert the 63 distinct photos from `transport/owner-photos-2` (not committed), regenerate the manifest (alt per photo, captions/stickers for viral/ad/event, news plain), delete the old files.
- Licence type: Unsplash + owner-supplied kinds (own photo, AI image, supplied by TMI with unknown maker); source/licence URLs optional.
- `ImageCreditList` + credits intro copy: maker, source, licence, card count for reused photos.
- Copy: "Verrassingskist" → "Loot box", news title "Onderzoek: loot boxes", glossary term "loot box"; design doc wording.

## Out of scope

- GameCard / ThumbnailFrame kit, board layout, `app-tasks*.json`.
- Judging the owner's photos (thumbnail-imagery D11).

## Edges

| Feature area | Loop today                                 | Hook point                                 | Ride / new |
| ------------ | ------------------------------------------ | ------------------------------------------ | ---------- |
| card-imagery | manifest → `getCardImage` / credits        | manifest, types, lookup, `ImageCreditList` | ride       |
| game-content | ad/news cards, `GLOSSARY`, credits copy    | `adCards.ts`, `newsCards.ts`, `uiCopy.ts`  | ride       |
| public/cards | 68 files                                   | replaced by 63                             | ride       |
| docs         | DOC_DECISION_LOG, DOC_GAME_DESIGN, READMEs | § owner-photos                             | ride       |

## Size

S — data/asset swap plus a small credits-list change.

## Plan (S)

1. Acceptance test first: `cardImageLookup.test.ts` — `PLACEHOLDER_IDS` empty, no unused files, Unsplash photo page, reused photos share file and credit.
2. Build script (scratchpad): crop centre per photo, 640×480 WebP ≤ 140 KB, one file per distinct photo; emit manifest.
3. Types + lookup + `ImageCreditList` + credits copy.
4. Copy fix (loot box) + glossary.
5. Gates: tests, lint, type-check, arch, structure, feature docs, build + bundle budget; Playwright 390×844 on preview.

## Decisions

DECISIONS.md D1…D4
