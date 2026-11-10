# Brief — feed-top-card

Size: XS · Branch: `fix/feed-top-card` · Type: regression report (owner)

## Problem

Owner: "Layout voor top feed item zou card met top image moeten zijn." On phones (390×664, the Playwright iPhone 13 viewport) the newest feed post showed the photo beside the text, so it read as one of the compact older rows. Desktop (1440×900) was right.

## Cause (bisect)

Production builds of #38, #40, #43, #44, #45, #46 and #48 were measured with Playwright at 390×844, 390×664, 360×640, 844×390, 1024×768 and 1440×900 (feed list height and newest-post columns after two plays):

| Feed list height    | #38–#44               | #45                 | #46–#48               |
| ------------------- | --------------------- | ------------------- | --------------------- |
| 390×844             | 410 px → photo on top | 340 px → **beside** | 410 px → photo on top |
| 390×664             | 230 px → beside       | 160 px → beside     | 230 px → beside       |
| 360×640             | 197 px → beside       | 127 px → beside     | 197 px → beside       |
| 844×390             | 164 px → beside       | 94 px → beside      | 164 px → beside       |
| 1024×768 / 1440×900 | photo on top          | photo on top        | photo on top          |

No later PR changed the newest-post markup. The switch is `[@container(min-height:24rem)]:grid-cols-1` on `NewestPost` in `PhoneFeed.tsx`, added in #38 (2b9cb9a) as feed-images D3: the photo goes on top only when the feed box is at least 24rem (384 px) tall. A phone feed box is 160–230 px tall, so the photo has gone beside the text there since #38. #45 (bf5ba86, follower chat strip) cut another 70 px, which turned 390×844 side-by-side as well. #46 (5f8e643) gave that space back. So the top-image card showed only on tall phones and desktop, which is why it looked right before.

## Fix

Use one layout for the newest post: the top-image card (the existing tall variant: photo full-width on top, type, title, two-line body, comments). This removes the container query, the side-by-side columns and the `container-type:size` they needed. The drop slot gets the same shape. Older posts stay compact. On a short feed box the list scrolls inside the phone frame; the page itself still never scrolls.

## Success check

- `GameBoard.test.tsx` › "should render the newest post as a card with the photo on top when a card is played" fails on e1f3c50 and passes with the fix.
- Playwright at the six sizes: photo on top of the newest post, no document scroll.
