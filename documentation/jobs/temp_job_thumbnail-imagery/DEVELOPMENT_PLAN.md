# Development plan: Juicy thumbnail card imagery

## Summary

- **Goal:** cards look like YouTube thumbnails: expressive-face photos + a code-drawn treatment.
- **Why:** owner: images too neutral for 11-year-olds; clickbait should feel like clickbait.
- **Brief:** `BRIEF.md`
- **Size:** M — kit component + data + ~70 assets + dependency on the content lap's final id list
- **Acceptance test:** `src/components/common/ThumbnailFrame/ThumbnailFrame.test.tsx` (overlay parts render from data, alt preserved, overlay aria-hidden) + `src/features/card-imagery/services/cardImageLookup.test.ts` (every content id has an entry with licence fields and a thumbnail; every file exists; captions 1–3 words)
- **Plan review:** done 2026-11-05 (inline, single agent — lenses below)
- **Scope / constraints:** no new dependency; 150 KiB main-chunk budget (overlay is a few hundred bytes of JSX; manifest stays in the lazy board chunk); WebP ≤ 150 KB per file.

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 1 | Tokens + `ThumbnailFrame` kit component + tests | unit tests, lint, type-check | Pending |
| 2 | `GameCardImage.thumbnail` → GameCardArtwork; manifest type + lookup pass-through | unit tests, gallery renders | Pending |
| 3 | Source + process expressive photos for the current deck; manifest rewrite | manifest tests, contact sheet review | Pending |
| 4 | Align to the final id list from kids-content (add new, drop removed) | manifest tests vs final GAME_CONTENT | Pending (blocked on O1) |
| 5 | Playwright 390px screenshots, docs (README, DOC_DECISION_LOG) | screenshots, full gate | Pending |

## Conflict & compliance

- Applicable rules: architecture (kit = presentation only, no feature imports), code-style (naming F1: `ThumbnailFrame` is a role name; no hard-coded colours → tokens), file-placement (`components/common/<Name>/`, `public/cards/*.webp`), security (untrusted downloads in their own scratch folder), testing.
- File placements: `src/components/common/ThumbnailFrame/{ThumbnailFrame.tsx,thumbnailFrame.types.ts,ThumbnailFrame.test.tsx,index.ts}`; tokens in `src/shared/theme/tokens/base.tokens.json`.
- Reuse / packages: none needed — CSS filters + inline SVG + text; no image-processing at runtime.
- Foundation cleanup: none — the existing artwork/fallback path is reused unchanged.
- Risks / open questions: Openverse has few expressive CC0 faces → widen to CC BY Flickr with attribution; check every picked photo for minors by eye. Content lap renames ids → Phase 4.
- Standards diversions: none.

## Review contract

- **Rules pinned:** `.claude/rules/{architecture,code-style,file-placement,security,testing}.md`
- **Required lenses:** Pattern & precedent (below), Reuse (none), Feature decomposition (kit vs card-imagery split, D2), Naming (`ThumbnailFrame`, `thumbnail` field).
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** card-imagery README D1–D5 (D5 "photos, not illustrations" stays; this lap swaps object photos for face photos), DECISIONS.md D1–D6

### Amendments

| # | Date | Source | Change | Applied to |
|---|------|--------|--------|------------|

## Pattern & precedent

| Field | Value |
|-------|--------|
| **Capability** | Clickbait thumbnail look drawn over a photo |
| **Precedents** | YouTube thumbnails (face + arrow/circle + 2–3 word caption + outline), Canva/Photoshop thumbnail templates |
| **Aspects reviewed** | legibility at small size; accessibility (alt, overlay hidden); data-driven vs baked |
| **Findings** | aligns: caption ≤ 3 words in heavy outlined type, one arrow/circle, emoji; diverges (better): drawn in code so captions stay editable and translatable, baked in no pixels |
| **Verdict** | Aligns with precedent |

## Notes during development

## Decisions made

| # | Topic | Choice | Precedent? |
|---|-------|--------|------------|
