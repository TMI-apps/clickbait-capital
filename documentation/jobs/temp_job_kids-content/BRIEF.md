# Brief — Kids content (groep 7/8)

Task: Orchestrator request: language level + content fit for 11-year-olds · Lap: temp_job_kids-content · Branch: feat/kids-content · Harness: v0.45.0

## Problem

The game is played by pupils of about 11 (groep 7/8), but the copy is written for adults (long sentences, words like _toezichthouder_, _microtargeting_, _prospectus_) and a third of the deck is about adult life (student parties, riots, loans, gambling, rent, tax havens). Kids miss the lesson because they don't get the words or the situation.

## Success check

- Every player-facing text (cards, events, phase intros, endings, end report, `UI_COPY`, how-to-play, privacy) uses short sentences and everyday Dutch; hard words are emphasized and open a short meaning on tap or keyboard (Enter/Space, Escape closes); a screen reader hears the meaning on the term.
- Every marked term exists in the glossary, every glossary entry is used, and markup appears only in fields that render through the glossary text path (unit tests). Screen-reader announcements, the feed and the share card get plain text.
- The 20 worst-fitting items (rubric below) are gone and 40 new cards/events from the pupils' world are in, without real game or brand names (unit test on a banned-name list).
- Balance simulation assertions stay green with the same winning/losing styles.
- A card without an image renders the type-icon placeholder without errors.
- Playwright at 390 px on the preview: tap a marked word → meaning shows; keyboard opens/closes it; a scripted full game runs to an end screen with no console errors.

## In scope

- Kit: `GlossaryTerm` (Radix Popover from the existing `radix-ui` package — tap/click to open, focusable button, Escape closes, meaning linked with `aria-describedby`) and `GlossaryText` (renders a marked string) in `src/components/common/GlossaryTerm/`.
- `src/shared/utils/glossaryMarkup.ts`: parse / strip / list terms of `[[woord]]` and `[[getoonde vorm|term]]`.
- game-content: `GLOSSARY` (term → uitleg, in `uiCopy.ts`), rewrite of all copy, deck swap (−17 cards, −3 events; +34 cards, +6 events), tests (glossary coverage, markup placement, banned names, profile per type), README.
- Render sites: `CardDetailDialog` description + flavor, `EventModal` description, `PhaseTransitionScreen`, `EndingScreen`, `ResultsScreen` intro, `HowToPlayPage`, `PrivacyPage`, `CreditsPage`; kit `Modal.description` and `GameCard.flavor` accept `ReactNode`.
- Plain text: `boardView` feed entries strip markup (feed + announcements).
- Docs: `DOC_GAME_DESIGN.md` (audience + card types), `DOC_DECISION_LOG.md` section.

## Out of scope

- Will NOT do: new images (image lap), engine rule changes, i18n, glossary terms inside buttons/titles (no interactive content inside interactive controls).
- Will NOT touch: game-board layout/drag files (`PlayingBoard`, `CardDraft`, `PhoneFeed`, … — parallel lap), `src/config/app-tasks*.json`, protected configs.

## Edges

| Feature area      | Loop today                             | Hook point                                                                       | Ride / new                                        |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| components/common | `Tooltip` (hover), `Modal`, `GameCard` | new `GlossaryTerm` folder; `Modal.description` / `GameCard.flavor` → `ReactNode` | new kit component + ride                          |
| shared/utils      | —                                      | `glossaryMarkup.ts`                                                              | new (2+ consumers: kit, game-content, game-board) |
| game-content      | full deck + copy                       | glossary, copy rewrite, deck swap, tests                                         | ride                                              |
| game-flow         | flow screens render strings            | `GlossaryText` at body/tip/lesson/intro                                          | ride                                              |
| game-board        | `CardDetailDialog`, `boardView`        | `GlossaryText` in dialog; strip in feed entries                                  | ride (no layout files)                            |
| pages             | HowToPlay, Privacy, Credits            | `GlossaryText`                                                                   | ride                                              |
| card-imagery | `getCardImage` by id; manifest per id | removed ids leave the manifest (photos deleted); new ids return null → placeholder; test + README | ride (added at build, D10) |
| app-status, game-settings | consume `UI_COPY` | app-status test literal ("Geen internet"); settings labels kept (D12) | ride (added at build) |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M — one small kit component and parser (narrow code), plus a large data rewrite. Kept as one PR: splitting language and deck would rewrite the 20 removed items for nothing; the code part is reviewable on its own commit.
Cut into laps: none

## Content-fit rubric

Each card/event scored 0–2 on three questions; total 0–6. Remove the lowest 30 % (20 of 67). Ties broken by **A** first (adult-only topic goes first), then by keeping the per-type balance. Milestone events (one per phase 2–4, design § 6) are structural: rewritten, not removable.

- **R — Relatable:** does an 11-year-old know this situation (games, streamers, memes, school, group chats, fatbikes)? 0 = adult life, 1 = known from TV/parents, 2 = their own world.
- **L — Lesson:** does it show clearly how engagement, ads or misinformation make money or do harm? 0 = unclear, 1 = indirect, 2 = clear.
- **A — Age fit:** 0 = adult-only (gambling, loans, alcohol/parties, riots, war footage, energy drinks), 1 = heavy but explainable, 2 = fine.

| Id                         | R   | L   | A   | Total | Verdict                                                              |
| -------------------------- | --- | --- | --- | ----- | -------------------------------------------------------------------- |
| viral-kat-komkommer        | 2   | 1   | 2   | 5     | keep                                                                 |
| viral-woedende-livestream  | 2   | 2   | 2   | 6     | keep                                                                 |
| viral-wondermiddel         | 1   | 2   | 1   | 4     | keep                                                                 |
| viral-diepvries-challenge  | 2   | 2   | 2   | 6     | keep                                                                 |
| viral-pindakaasruzie       | 2   | 2   | 2   | 6     | keep                                                                 |
| viral-reactievideo         | 2   | 1   | 2   | 5     | keep                                                                 |
| viral-studentenfeest       | 0   | 1   | 0   | 1     | **remove** — student party on a bar                                  |
| viral-docentmeme           | 1   | 1   | 2   | 4     | keep (college → teacher)                                             |
| viral-mensaprank           | 1   | 1   | 2   | 4     | keep (mensa → school canteen)                                        |
| viral-roddelkanaal         | 1   | 2   | 1   | 4     | keep                                                                 |
| viral-unboxing             | 2   | 1   | 2   | 5     | keep                                                                 |
| viral-wolkencomplot        | 1   | 2   | 2   | 5     | keep                                                                 |
| viral-deepfake-minister    | 0   | 2   | 1   | 3     | **remove** — war announcement, politics (A1)                         |
| viral-rellen-live          | 0   | 1   | 0   | 1     | **remove** — riots and fire                                          |
| viral-ai-babykittens       | 2   | 2   | 2   | 6     | keep                                                                 |
| viral-ceo-nachtpost        | 0   | 1   | 2   | 3     | **remove** — founder vs. regulator, adult world (tie, viral balance) |
| viral-merkboycot           | 0   | 1   | 2   | 3     | **remove** — consumer boycott (tie, viral balance)                   |
| viral-wij-tegen-zij        | 0   | 2   | 1   | 3     | **remove** — blaming groups (A1)                                     |
| ad-gokapp                  | 0   | 2   | 0   | 2     | **remove** — gambling                                                |
| ad-mooncoin                | 1   | 2   | 1   | 4     | keep                                                                 |
| ad-dropshipping            | 1   | 2   | 1   | 4     | keep                                                                 |
| ad-detoxthee               | 1   | 2   | 1   | 4     | keep                                                                 |
| ad-preroll                 | 2   | 2   | 2   | 6     | keep                                                                 |
| ad-native                  | 0   | 2   | 2   | 4     | keep                                                                 |
| ad-pizzeria                | 1   | 1   | 2   | 4     | keep                                                                 |
| ad-bijlesapp               | 1   | 2   | 2   | 5     | keep                                                                 |
| ad-nachtuil                | 1   | 2   | 0   | 3     | **remove** — energy drink at night (A0)                              |
| ad-datadeal                | 0   | 2   | 2   | 4     | keep                                                                 |
| ad-influencerdeal          | 2   | 2   | 2   | 6     | keep                                                                 |
| ad-premium                 | 1   | 2   | 2   | 5     | keep                                                                 |
| ad-microtargeting          | 0   | 2   | 1   | 3     | **remove** — lonely thirty-somethings (A1)                           |
| ad-gokreclame-wk           | 1   | 2   | 0   | 3     | **remove** — sports betting                                          |
| ad-flitslening             | 0   | 2   | 0   | 2     | **remove** — loans                                                   |
| ad-kwartaalcijfers         | 0   | 2   | 2   | 4     | keep                                                                 |
| ad-dataabonnement          | 0   | 2   | 2   | 4     | keep                                                                 |
| ad-gesponsorde-feed        | 1   | 2   | 2   | 5     | keep                                                                 |
| news-factcheck-foto        | 2   | 2   | 2   | 6     | keep                                                                 |
| news-gemeenteraad          | 0   | 1   | 2   | 3     | **remove** — council meeting (tie, news balance)                     |
| news-klimaatrapport        | 1   | 1   | 2   | 4     | keep                                                                 |
| news-zorgfraude            | 0   | 1   | 1   | 2     | **remove** — healthcare fraud                                        |
| news-uitleg-inflatie       | 0   | 1   | 2   | 3     | keep (tie: kids know "stuff gets pricier")                           |
| news-rectificatie          | 0   | 2   | 2   | 4     | keep                                                                 |
| news-campuskrant           | 0   | 1   | 1   | 2     | **remove** — student rent                                            |
| news-bronvermelding        | 1   | 2   | 2   | 5     | keep                                                                 |
| news-bakker                | 1   | 1   | 2   | 4     | keep                                                                 |
| news-moderatieteam         | 0   | 2   | 1   | 3     | **remove** — moderators' trauma (A1)                                 |
| news-labels                | 1   | 2   | 2   | 5     | keep                                                                 |
| news-datalek               | 1   | 2   | 2   | 5     | keep                                                                 |
| news-verkiezingsdebat      | 0   | 1   | 2   | 3     | keep (tie: pairs with the election event)                            |
| news-beeldverificatie      | 0   | 2   | 0   | 2     | **remove** — war footage                                             |
| news-schermtijd            | 2   | 2   | 2   | 6     | keep                                                                 |
| news-transparantierapport  | 0   | 2   | 2   | 4     | keep                                                                 |
| news-klokkenluider-eigen   | 0   | 1   | 2   | 3     | keep (tie: only "own up to mistakes" card)                           |
| news-eerlijk-jaarverslag   | 0   | 1   | 2   | 3     | **remove** — annual report (tie, news balance)                       |
| event-eerste-shitstorm     | 1   | 2   | 2   | 5     | keep (renamed "ophef": no swear word)                                |
| event-investeerders        | 0   | 2   | 2   | 4     | keep (milestone)                                                     |
| event-concurrent-kloon     | 1   | 2   | 2   | 5     | keep                                                                 |
| event-advertentieklachten  | 2   | 2   | 2   | 6     | keep                                                                 |
| event-moderatoren          | 0   | 2   | 1   | 3     | **remove** — moderators drowning in hate (A1)                        |
| event-wereldwijd           | 0   | 1   | 2   | 3     | keep (milestone; tax haven option rewritten)                         |
| event-toezichthouder-boete | 0   | 2   | 2   | 4     | keep                                                                 |
| event-verkiezingen         | 0   | 2   | 2   | 4     | keep (design § 4 example, asserted)                                  |
| event-hoorzitting          | 0   | 2   | 2   | 4     | keep                                                                 |
| event-adverteerdersboycot  | 0   | 2   | 1   | 3     | **remove** — hate messages, brand boycott (A1)                       |
| event-roadshow             | 0   | 1   | 2   | 3     | keep (milestone)                                                     |
| event-shortseller          | 0   | 1   | 2   | 3     | **remove** — short selling (tie, adult finance)                      |
| event-gelekte-documenten   | 1   | 2   | 2   | 5     | keep                                                                 |

Removed: 20 (viral 6, ad 5, news 6, events 3). Added: 40 (viral 12, ad 10, news 12, events 6) — twice per category. New pools: viral 24 / ad 23 / news 24 (8 / 7 / 8 for every phase plus 4 per phase), 16 events. New ids are listed in the PR for the image lap.

## Plan

`DEVELOPMENT_PLAN.md`.

## Decisions

`DECISIONS.md` D1–D12.
