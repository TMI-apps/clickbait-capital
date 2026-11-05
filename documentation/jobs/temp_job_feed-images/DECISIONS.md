# Decisions — feed-images

Job: `temp_job_feed-images`
Updated: 2026-11-05

## Closed

| id  | topic             | status | choice                                                                                                                                                              | source      | notes                                                                                                                                    |
| --- | ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Image path        | closed | Feed reuses the kit's `GameCardArtwork` (exported from the GameCard barrel) with `getCardImage(entry.contentId)`; `FeedEntry` carries the content id, not the image | loop-plan   | lost: an image field on `FeedEntry` (board services would import card-imagery for a UI concern); a feed-only `<img>` (second image path) |
| D2  | Newest vs older   | closed | Newest post: photo + type + title + body; older posts: compact row (64 px photo, type, title), body kept as screen-reader text                                      | owner brief | keeps the feed readable with many posts                                                                                                  |
| D3  | Newest layout     | closed | Feed scroll box is a size container: photo on top when it is at least 24rem tall, beside the text otherwise                                                         | loop-plan   | 375×667 feed box is ~210 px tall: a full-width 4:3 photo (~240 px) would not fit                                                         |
| D4  | Compact thumbnail | closed | Compact rows drop caption / sticker / marker (boost and glow stay); the newest post has the full treatment                                                          | loop-plan   | 10.5cqw caption at 64 px is ~7 px: noise, not text                                                                                       |
| D5  | Drag hint         | closed | "Laat los om te plaatsen" overlays the top of the feed; the post list scrolls back to the top when a post arrives                                                   | loop-plan   | newest post stays visible without scrolling, no layout shift while dragging                                                              |
