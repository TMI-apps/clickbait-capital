# Card imagery

Pictures for the cards and events of the deck and the hero photo of each phase intro (all chosen by the owner), and the credit `/credits` shows for each. Content ids come from `@/features/game-content/api`; the pictures live in `public/cards/`.

## Purpose

- `getCardImage(contentId)` returns `{ src, alt, focalPoint, width, height, thumbnail }` for the GameCard `image` prop, or `null` for an unknown id (the card then shows its type-icon fallback; every deck id has a picture). The board wires it in: `<GameCard image={getCardImage(card.id) ?? undefined} … />`.
- `thumbnail` (manifest field, optional): caption (1–3 words, about the topic, never a quote from the pictured person), emoji sticker and red arrow/circle marker. The GameCard kit draws it over the photo with `ThumbnailFrame` (`src/components/common/ThumbnailFrame/`), plus an always-on colour boost and type-coloured glow (thumbnail-imagery D2, D3, D8). News entries carry no `thumbnail` and the kit draws news photos plain (D7).
- `getPhaseImage(phaseId)` returns `{ src, alt, focalPoint, width, height }` for the phase intro's hero (game-flow `PhaseTransitionScreen`), or `null` for an unknown phase.
- `listCardImageCredits()`, `listPhaseImageCredits()` and `ImageCreditList` feed the `/credits` page (phase photos first) (`src/pages/CreditsPage.tsx`), which also shows the game-audio credit.
- Not here: the board, the GameCard kit component (it already lazy-loads, crops 4:3 with `object-fit: cover` around the focal point, and falls back on a broken image).

## Structure

| Layer      | Path                               | Purpose                                                                                                                                                                    |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API        | `api/index.ts`                     | Public barrel: `getCardImage`, `getPhaseImage`, `listCardImageCredits`, `listPhaseImageCredits`, `formatCardImageCredit`, `ImageCreditList`, both manifests, size constants, types |
| Components | `components/ImageCreditList.tsx`   | Credit list: lazy 64×48 thumbnail (the credit's `src`), maker, source and licence (linked when they have a page), card count for reused photos                                                  |
| Services   | `services/cardImageManifest.ts`    | Generated manifest, one entry per content id                                                                                                                               |
| Services   | `services/cardImageLookup.ts`      | Lookup by id, credit lines, `CARD_IMAGE_WIDTH` / `CARD_IMAGE_HEIGHT`                                                                                                       |
| Services   | `services/phaseImageManifest.ts`   | One hero photo per phase (owner's order)                                                                                                                                   |
| Services   | `services/phaseImageLookup.ts`     | Lookup by phase, phase credits, `PHASE_IMAGE_WIDTH` / `PHASE_IMAGE_HEIGHT`                                                                                                 |
| Tests      | `services/phaseImageLookup.test.ts` | Every phase has a photo under 150 KB with an Unsplash credit and a Dutch alt; lookup and credits                                                                          |
| Tests      | `services/cardImageLookup.test.ts` | Every deck id has an entry with a file under 150 KB; no unused files; maker and allowed licence; Unsplash photo page; reused photos share file and credit; thumbnail rules |
| Types      | `types/cardImage.types.ts`         | `CardImageManifestEntry`, `CardImage`, `PhaseImageManifestEntry`, `PhaseImage`, `CardImageCredit` (carries the thumbnail `src`), `CardImageLicense`                       |

## Files

`public/cards/<first-id>.webp`: one 640×480 (4:3) WebP master per distinct photo, named after the first id that uses it (63 files, about 1.7 MB, all under 140 KB). A photo the owner reused for several ids is one file; the later entries point at it and name the first id in `reusedFrom`. 640 px covers the card's on-screen width at 2× pixel density, so there is no `srcset`. Never hotlinked: the files are served from this app.

## Phase photos

`public/cards/phase-<n>-<slug>.webp`: one 1200×675 (16:9) WebP per phase (phase-images lap): 1 De Zolderkamer (Faizur Rehman), 2 De Scale-Up (Austin Distel), 3 Wereldwijd Platform (Proxyclick Visitor Management System), 4 De Beursgang (Sean Pollock), all Unsplash License; 65–131 KB, about 440 KB together. The owner chose them (used as supplied, thumbnail-imagery D11). Processing: crop 16:9 around the subject, resize, WebP with quality lowered from 80 until under 140 KB, like the cards. 1200 px covers the 576 px intro column at 2×. They sit next to the card photos, so the "no unused file" test covers both manifests and the `card-images` runtime cache serves them (not precached: phase-images D4).

## Sourcing (how the manifest was built)

- **Owner's sheet (owner-photos lap):** the owner assigned a photo to every card and event id (87 ids, 63 distinct photos). They are used exactly as assigned, with no agent filter (thumbnail-imagery D11). 57 are Unsplash photos (Unsplash License: maker's name from the original file name, photo page `https://unsplash.com/photos/<id>`), 3 are TMI's own photos, 1 is an AI image TMI made (Google Gemini), and 2 are supplied by TMI with an unknown maker (credited "Aangeleverd door TMI").
- **Captions:** viral / ad / event entries get a caption and sticker about the card's topic, never words in the pictured person's mouth; news stays plain (thumbnail-imagery D7). Markers sit where the photo has a clear subject.
- **Processing:** crop 4:3 around a chosen point in the original, resize to 640×480, WebP (quality lowered until under 140 KB). The manifest's `focalPoint` is where that point lands in the master.
- The build script ran once and is not part of the app. To replace one picture: export it as above to `public/cards/<id>.webp`, edit that entry (alt, author, source, licence, thumbnail); the tests catch a missing or unused file, a licence outside the allowed set or a caption that breaks the rules.

## Decisions

- **Own feature (card-imagery D1):** license provenance and credits are their own concept; game-content stays rules plus copy.
- **Alt per photo (D2):** the manifest's Dutch alt describes the real photo; game-content's `imageAlt` described an imagined illustration and is not used for images.
- **WebP only, one size (D3):** universal support, small files; AVIF would double the files for a few KB each.
- **Credits on `/credits` (D4, owner-photos D3):** one row per distinct photo: maker's name, source page and licence (linked when they have one), and the card count when the owner reused it.
- **Photos, not illustrations (D5):** the content's image themes describe satirical illustrations; the owner picks photos that match them (owner-photos lap).

- **Every card has a photo (owner-photos D1):** the owner's sheet covers every id, so `PLACEHOLDER_IDS` is empty; an id without an entry would still show GameCard's type-icon placeholder (D6).
- **Thumbnail look (thumbnail-imagery D2–D8):** expressive photos plus caption / sticker / marker data per entry, drawn by the `ThumbnailFrame` kit component; news stays plain.
- **Phase photos here (phase-images D1):** the phase intro photos need the same provenance and credits, so card-imagery owns them; game-flow only shows them.
- **Owner's pictures only (owner-photos D1, D2):** the CC0 / CC BY fallbacks are gone; licences are the Unsplash License plus three owner-supplied kinds (own photo, AI image, supplied with unknown maker).

## Dependencies

- `@/features/game-content/api` (ids and `PHASE_INTROS` in tests only), kit-free UI (`cn`).
