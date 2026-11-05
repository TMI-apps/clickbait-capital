# Card imagery

Pictures for the cards and events of the deck, and the attribution their open licenses require. Content ids come from `@/features/game-content/api`; the pictures live in `public/cards/`.

## Purpose

- `getCardImage(contentId)` returns `{ src, alt, focalPoint, width, height, thumbnail }` for the GameCard `image` prop, or `null` (the card then shows its type-icon fallback). The board wires it in: `<GameCard image={getCardImage(card.id) ?? undefined} … />`.
- `thumbnail` (manifest field, optional): caption (1–3 words, about the topic, never a quote from the pictured person), emoji sticker and red arrow/circle marker. The GameCard kit draws it over the photo with `ThumbnailFrame` (`src/components/common/ThumbnailFrame/`), plus an always-on colour boost and type-coloured glow (thumbnail-imagery D2, D3, D8). News entries carry no `thumbnail` and the kit draws news photos plain (D7).
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

`public/cards/<contentId>.webp`: one 640×480 (4:3) WebP master per id, quality 68, about 1.8 MB for the 68 photos (all under 140 KB). 640 px covers the card's on-screen width at 2× pixel density, so there is no `srcset`. Never hotlinked: the files are downloaded once at sourcing time and served from this app.

## Sourcing (how the manifest was built)

- **Owner photos (thumbnail-imagery D10):** 34 entries use photos the owner picked on Unsplash (Unsplash License: free use, credit author and photo page). Two of those photos serve two ids each (`reusedFrom`). Title "Foto op Unsplash", author and photo page from the owner's list.
- **Vetted fallbacks (D11):** expressive adult faces from Openverse (CC0 StockSnap, CC BY Flickr); each licence was checked on the source page at build time, and the page wins over Openverse's index (one photo is CC BY 4.0 there).
- **Kept from the first imagery lap:** the remaining entries keep their CC0 / CC BY object photos (Openverse, object-focused queries); the clickbait ones get a thumbnail caption.
- **Review rules:** for agent-sourced fallbacks: adults only, no brands or logos, no swimwear, no real public figures. Owner-supplied photos are the owner's call and are used as assigned (thumbnail-imagery D11). For every photo: captions stay about the topic and never put words in a person's mouth.
- **Processing:** crop 4:3 around a chosen point (optional zoom), resize to 640×480, WebP (quality lowered until under 140 KB). The manifest's `focalPoint` is where that point lands in the master.
- **Still a placeholder:** the ids in `PLACEHOLDER_IDS` (`services/cardImageLookup.test.ts`) have no entry yet; GameCard shows the type icon.
- The sourcing scripts ran at build time and are not part of the app. To replace one picture: export a CC0 / CC BY / Unsplash original as above to `public/cards/<id>.webp`, edit that entry (alt, title, author, source, license, thumbnail) and drop the id from `PLACEHOLDER_IDS` if it was there; the tests catch a missing file, a licence outside the allowed set or a caption that breaks the rules.

## Decisions

- **Own feature (card-imagery D1):** license provenance and credits are their own concept; game-content stays rules plus copy.
- **Alt per photo (D2):** the manifest's Dutch alt describes the real photo; game-content's `imageAlt` described an imagined illustration and is not used for images.
- **WebP only, one size (D3):** universal support, small files; AVIF would double the files for a few KB each.
- **Credits on `/credits` (D4):** TASL per photo (title linked to the source, author, license linked to the deed); CC0 photos are credited too, out of courtesy.
- **Photos, not illustrations (D5):** the content's image themes describe satirical illustrations; free photos match them loosely (an object that stands for the card, such as a railway whistle board for the whistleblower). A generated illustration set would match better but needs the owner's say (cost, style).

- **New cards wait for a photo (D6, kids-content; narrowed by thumbnail-imagery):** a card without a manifest entry shows GameCard's type-icon placeholder; the remaining ones are listed in `PLACEHOLDER_IDS`.
- **Thumbnail look (thumbnail-imagery D2–D8):** expressive photos plus caption / sticker / marker data per entry, drawn by the `ThumbnailFrame` kit component; news stays plain.
- **Unsplash allowed for owner picks (thumbnail-imagery D10):** next to CC0 / CC BY; credited like CC BY on `/credits`.

## Dependencies

- `@/features/game-content/api` (ids in tests only), kit-free UI (`cn`).
