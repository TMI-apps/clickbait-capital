# Brief — decision-imagery

Task: orchestrator, lap 3 of `documentation/jobs/temp_job_policy-cards/PROPOSAL.md` § 10 · Branch: `feat/decision-imagery` · Size: S

## Problem

The 24 decision cards and 12 decision scandals (decision-cards lap) show the type-icon placeholder. The owner picked open-licence photos for 20 of them from the candidates on `transport/decision-images` (MANIFEST.csv: V1–V8, A1–A8, N1–N8, E1–E12).

## Success check

`cardImageLookup.test.ts`: every deck id has a photo except the 16 the owner left on the placeholder; every CC BY photo is credited with maker, Flickr / StockSnap page and licence page; files under 150 KB, none unused. In the browser: a few decision cards show their photo in hand and in the card detail; `/credits` lists them with source and licence links.

## Scope

- In: the 20 owner picks (V1-A, V2-A, V3-A, V5-A, V7-A, V8-A, A3-A, A5-B, A8-A, N1-A, N2-A, N3-A, N5-A, N7-A, E2-A, E3-B, E4-A, E6-A, E8-A, E12-A) as 640×480 WebP in `public/cards/<id>.webp`; manifest entries with Dutch alt and, for non-news, caption and sticker; licences CC0 1.0 / Public Domain Mark 1.0 / CC BY 2.0 with licence page; credit source label per site; `/credits` intro copy.
- Out: the other 16 ids (V4, V6, A1, A2, A4, A6, A7, N4, N6, N8, E1, E5, E7, E9, E10, E11); the candidate folder itself (stays on the transport branch); the official-account avatar (separate item of § 10).
- Edges: `card-imagery` (manifest, types, lookup, credit list, test, README), `game-content` (credits intro copy), `public/cards/`.

## Plan

1. Map manifest ids to content ids via `title_nl`; crop 4:3 around the subject, 640×480 WebP, quality 80 (all under 80 KB).
2. Widen `CardImageLicense` with the three open licences; `formatImageSourceLabel` names the source site in the credit ("Foto op Flickr").
3. Update the test's `PLACEHOLDER_IDS` to the 16, source-page and CC BY credit checks.
4. Browser check on the preview: hand, card detail, `/credits`.
