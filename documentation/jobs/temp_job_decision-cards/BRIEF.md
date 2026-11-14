# Brief — Decision cards (lap 2 of policy-cards)

Task: orchestrator, lap 2 of `documentation/jobs/temp_job_policy-cards/PROPOSAL.md` § 10 · Branch: `feat/decision-cards` · Size: M

## Problem

Every card is a single post. The owner wants the later phases to feel like company decisions (policy-cards D1–D4): inside the three existing types, without a new type or engine change, with the real event one tap away.

## Success check

- 24 decision cards (8 per type) with `announce` and `realCase`, phase share 0 / 14 / 33 / 50 % (asserted in `gameContent.test.ts`); the 8 (ads 7) every-phase posts leave phase 4; texts of existing posts unchanged.
- 12 scandal events (E1–E12), heavy topics fictional and non-graphic; glossary _privé_, _moderator_, _lobby_.
- Card detail shows "Echt gebeurd: …" with a "Lees het artikel" link (new tab, `noopener noreferrer`, external-link icon, accessible name with publisher, date and "opent in een nieuw tabblad"); nowhere else.
- Followers react with `official` lines under decision posts; privacy page names the external link.
- Content tests: https url, plain text, no brand names in the line, required fields. Balance simulation keeps every asserted outcome without touching balance constants. `SAVED_RUN_VERSION` 7 → 8.

## In scope

game-content (cards, events, copy, glossary, followers, types, tests), follower-comments (official cue), game-board (`boardView` real case + announce, `CardDetailDialog`, minimal "Officieel ✓" in `PhoneFeed`), game-save (version), card-imagery test (placeholder list), privacy copy, `DOC_GAME_DESIGN.md` § 4 and § 6, READMEs, decision log.

## Out of scope

App naming, `{app}`, the official-account feed header and post variant (lap 1 `feat/app-name`; copy says "jouw app" until then and the feed marker is minimal); images for the new cards and events (lap 3; they use the type-icon placeholder).

## Plan (built)

1. Types: `CardAnnouncement`, `RealCase` on `CardPresentation`; cues `officialViral|Ad|News`.
2. Content: decisions appended per type file; every-phase posts narrowed to `[1, 2, 3]`; events appended; glossary; follower lines; board and privacy copy.
3. Board: `realCaseOf` / `announceOf` read by shape (game-content D2), `RealCaseLine` in the dialog, `official` on `FeedEntry`.
4. Tests: content, follower cue, board view, dialog, imagery placeholders, save version literals.
5. Balance before/after, tune content values only.

## Source check (opened once, 2026-11-14)

Plain `curl -L` (no browser headers) and a fetch of each article. Bot-blocked responses (406/429/503) were re-checked by reading the article through a fetch tool or the publisher's text-only copy.

| Card   | Source (publisher, date)                      | Result                                                                                                                                                                      |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1     | NPR via The Public's Radio, apr. 2026         | 429 to curl; article loads, inventor says he is sorry                                                                                                                       |
| V2     | Engadget, okt. 2024                           | 200                                                                                                                                                                         |
| V3, V5 | Europese Commissie, feb. 2026 (press release) | replaces Euronews: that page loaded but did not name autoplay or notifications; the Commission names infinite scroll, autoplay, push notifications                          |
| V4     | CBS News, okt. 2021                           | swapped from TIME (paywall); NPR Fresh Air also fits but mentions suicide, so the gentler CBS piece was chosen; line now says "berichten vol ruzie" (CBS: divisive content) |
| V6     | NPR, sep. 2021                                | swapped from MIT Technology Review (paywall); line names body image, not filters, as the article does                                                                       |
| V7, N6 | CBS News (AP), jan. 2024                      | 200                                                                                                                                                                         |
| V8     | Tubefilter, jan. 2023                         | 200                                                                                                                                                                         |
| A1     | Future of Privacy Forum, sep. 2019            | 200                                                                                                                                                                         |
| A2     | AP via ABC News 4, jul. 2019                  | 200                                                                                                                                                                         |
| A3     | Europese Commissie, dec. 2025                 | 200                                                                                                                                                                         |
| A4     | TechCrunch, dec. 2022                         | 200 (nearby case on purpose, PROPOSAL § 5b)                                                                                                                                 |
| A5     | CBS News, mei 2017                            | swapped from MIT Technology Review (paywall)                                                                                                                                |
| A6     | Social Media Today (Reuters), nov. 2025       | 200                                                                                                                                                                         |
| A7     | Africanews, mei 2022                          | 406 to curl; loads with trailing slash (without it a 301), url stored with the slash                                                                                        |
| A8, N2 | PBS NewsHour, jan. 2025                       | 200                                                                                                                                                                         |
| N1     | The Record, sep. 2023                         | 200                                                                                                                                                                         |
| N3     | NPR, okt. 2024                                | 200                                                                                                                                                                         |
| N4     | TechCrunch, mei 2021                          | swapped from the company's own newsroom; setting is opt-in                                                                                                                  |
| N5     | CNN via KVIA, dec. 2024                       | 200                                                                                                                                                                         |
| N7     | NPR, okt. 2021                                | swapped from TIME (paywall)                                                                                                                                                 |
| N8     | NPR, jun. 2018                                | gentler than the Amnesty report ("genocide" once, no graphic detail); the criticism comes from UN investigators, so the line now cites "onderzoekers van de VN"             |

NPR's www pages answered 503 to the fetch tool; their text-only copies (same story id) were read instead. Not verified: that each link opens in every school network.
