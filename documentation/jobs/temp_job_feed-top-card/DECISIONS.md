# Decisions — feed-top-card

Job: `temp_job_feed-top-card`
Updated: 2026-11-10

## Closed

| id  | topic         | status | choice                                                                                                                                                                                                        | source                  | notes                                                                                                                                                                                                                                                            |
| --- | ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Newest layout | closed | The newest feed post is always the top-image card (photo full-width on top, then type, title, body, comments), on every screen size. On a short feed box the list scrolls internally. Replaces feed-images D3 | owner regression report | Regression: feed-images D3 (#38, 2b9cb9a) put the photo beside the text below a 24rem feed box. That covers every phone viewport (160–230 px feed box), so the newest post read as a compact row. #45 also flipped 390×844 until #46. Locked by a GameBoard test |
