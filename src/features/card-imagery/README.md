# Card imagery

Pictures for the cards and events of the deck, and the attribution their open licenses require. Content ids come from `@/features/game-content/api`; the pictures live in `public/cards/`.

## Purpose

- `getCardImage(contentId)` returns `{ src, alt, focalPoint, width, height, thumbnail }` for the GameCard `image` prop, or `null` (the card then shows its type-icon fallback). The board wires it in: `<GameCard image={getCardImage(card.id) ?? undefined} … />`.
- `thumbnail` (manifest field, optional): caption (1–3 words, about the topic, never a quote from the pictured person), emoji sticker and red arrow/circle marker. The GameCard kit draws it over the photo with `ThumbnailFrame` (`src/components/common/ThumbnailFrame/`), plus an always-on colour boost and type-coloured outline (thumbnail-imagery D2, D3).
- `listCardImageCredits()` and `ImageCreditList` feed the `/credits` page (`src/pages/CreditsPage.tsx`), which also shows the game-audio credit.
- Not here: the board, the GameCard kit component (it already lazy-loads, crops 4:3 with `object-fit: cover` around the focal point, and falls back on a broken image).

## Structure

| Layer      | Path                               | Purpose                                                                                                                                                                               |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                     | Public barrel: `getCardImage`, `listCardImageCredits`, `formatCardImageCredit`, `ImageCreditList`, `CARD_IMAGE_MANIFEST`, size constants, types                                       |
| Components | `components/ImageCreditList.tsx`   | Credit list: lazy 64×48 thumbnail, linked title (source), author, linked license                                                                                                      |
| Services   | `services/cardImageManifest.ts`    | Generated manifest, one entry per content id                                                                                                                                          |
| Services   | `services/cardImageLookup.ts`      | Lookup by id, credit lines, `CARD_IMAGE_WIDTH` / `CARD_IMAGE_HEIGHT`                                                                                                                  |
| Tests      | `services/cardImageLookup.test.ts` | Every manifest entry belongs to a deck id and has a file under 150 KB; only the 40 kids-content additions lack a photo; allowed license with matching URL; attribution fields present |
| Types      | `types/cardImage.types.ts`         | `CardImageManifestEntry`, `CardImage`, `CardImageCredit`, `CardImageLicense`                                                                                                          |

## Files

`public/cards/<contentId>.webp`: one 640×480 (4:3) WebP master per id, quality 68, about 1.4 MB for the 47 photos (median 25 KB, largest 126 KB). 640 px covers the card's on-screen width at 2× pixel density, so there is no `srcset`. Never hotlinked: the files are downloaded once at sourcing time and served from this app.

## Sourcing (how the manifest was built)

- Search: Openverse API (`api.openverse.org/v1/images`, anonymous, no key; `license=cc0,by`, `category=photograph`, `mature=false`), one object-focused query per id derived from the content `imageTheme`.
- Review: candidates on contact sheets; rejected people (faces, minors), recognizable venues, brands or logos, copyrighted artworks or game art in the frame, and anything without a clear CC0 / CC BY license.
- Result (after kids-content): 24 × CC0 1.0, 23 × CC BY 2.0; sources Flickr 30, rawpixel 10 (public-domain collection), StockSnap 7. The kids-content lap removed the 20 cards and events it dropped from the deck, with their photos. No reuse across ids. No minors or people in frame, no recognizable venues.
- Processing: largest available rendition (Flickr `_b`, 1024 px), crop 4:3 around a chosen point, resize to 640×480, WebP. The manifest's `focalPoint` is where that point lands in the master (50/50 unless the crop hit an edge).
- License data (author, title, license, URL) is Openverse's index of the source page; the source link is kept per entry so it can be rechecked.
- The sourcing scripts were run by the agent at build time and are not part of the app. To replace one picture: download a CC0 / CC BY original, crop and export it as above to `public/cards/<id>.webp`, and edit that entry (alt, title, author, source, license); the tests catch a missing file or a license outside the allowed set.

## Decisions

- **Own feature (card-imagery D1):** license provenance and credits are their own concept; game-content stays rules plus copy.
- **Alt per photo (D2):** the manifest's Dutch alt describes the real photo; game-content's `imageAlt` described an imagined illustration and is not used for images.
- **WebP only, one size (D3):** universal support, small files; AVIF would double the files for a few KB each.
- **Credits on `/credits` (D4):** TASL per photo (title linked to the source, author, license linked to the deed); CC0 photos are credited too, out of courtesy.
- **Photos, not illustrations (D5):** the content's image themes describe satirical illustrations; free photos match them loosely (an object that stands for the card, such as a railway whistle board for the whistleblower). A generated illustration set would match better but needs the owner's say (cost, style).

- **New cards wait for the image lap (D6, kids-content):** the 40 cards and events added for 11-year-olds have no manifest entry; `getCardImage` returns `null` and GameCard shows its type-icon placeholder. A later lap replaces the imagery in a video-thumbnail style (the new content's `imageTheme` hints say so).

## Dependencies

- `@/features/game-content/api` (ids in tests only), kit-free UI (`cn`).
