# Decisions — share-card

Job: `temp_job_share-card`
Updated: 2026-11-05

## Closed

| id  | topic                  | status | choice                                                                                                                          | source                         | notes                                                                                                                  |
| --- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| D1  | Image renderer         | closed | Hand-written Canvas 2D renderer for one fixed 1080×1350 card, lazy `import()`; no package                                       | loop-plan (spec-reuse-package) | rejected: html-to-image / html2canvas (DOM snapshot, font/CORS quirks, +10–45 KiB), satori (+wasm, needs font buffers) |
| D2  | Share order            | closed | `navigator.share({ files, text, url })` when `canShare({ files })` → `share({ text, url })` → download PNG + copy text and link | loop-refine (task)             | AbortError (player closed the sheet) is silent                                                                         |
| D3  | When the image renders | closed | When the results screen mounts, so the click shares synchronously within the user activation                                    | loop-plan                      | Safari drops `share()` after an await outside the gesture                                                              |
| D4  | Card colors            | closed | Read from the computed design tokens when the results open (follows the theme active then)                                      | loop-plan                      | keeps tokens the SSOT; no hex in the renderer                                                                          |
| D5  | Shared link            | closed | `SITE_ORIGIN` + `/` (production), also from previews                                                                            | loop-plan                      | previews are not public entry points                                                                                   |

## Open

| id  | topic | status | options briefly | blocked phase |
| --- | ----- | ------ | --------------- | ------------- |

## Log

- 2026-11-05 — D1–D5 closed (clear-winner)
