# Brief — Score redesign: users and money are the score, reputation is a guard rail

Task: owner request via orchestrator (score redesign) · Lap: temp_job_score-redesign · Harness: v0.45.0

## Problem

Players cannot see how the three 0–100 bars (Inkomsten, Gebruikers, Reputatie) relate to their score: the score (users stat, gross omzet, phase goals of different kinds) is subtle and hidden in the phase header, so a card play has no visible impact on how well they are doing.

## Owner direction (recorded, not re-asked)

"Profit and users are targets that grow/shrink gradually and you want to keep as high as possible. Reputation is only relevant when it is in the danger zone. This should lure realistic business choices from social media app providers."

## Success check (this lap)

On the preview, `/mockup/score?v=a`, `?v=b` and `?v=c` each render at 390×844 and 1440×900 without document scroll; selecting a card shows its forecast, playing it animates the users and money numbers gradually (not a jump), and the scripted demo pushes reputation into the danger zone where the HUD turns loud (red, shake, warning). The real game (`/spel`), engine, balance and saves are unchanged (`git diff main --stat` touches no `game-engine`, `game-content`, `game-board`, `game-save` file).

## In scope (this lap: design + prototype)

- BRIEF, DECISIONS, DEVELOPMENT_PLAN with the precedent review and the full impact of the redesign, cut into follow-up laps.
- A throwaway `score-mockup` feature (pure fake momentum model + three HUD variants) behind the unlinked route `/mockup/score?v=a|b|c`, not indexed, no link from the app.
- Screenshots per variant (phone + desktop) and a report to the orchestrator.

## Out of scope

- Will NOT do: the real engine model, balance, phases, saves version, board UI, result/share, copy — follow-up laps (DEVELOPMENT_PLAN § Follow-up laps).
- Will NOT touch: `/spel` and every game feature; the mockup imports only kit components (`components/common`) and shared utils.

## Edges

| Feature area            | Loop today                 | Hook point                                        | Ride / new                                       |
| ----------------------- | -------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `App.tsx` routes        | lazy pages, fullscreen set | one lazy route `/mockup/score` + fullscreen entry | ride — removed in the build lap                  |
| `pages/`                | named pages                | `ScoreMockupPage.tsx` (thin: reads `?v`)          | new — throwaway                                  |
| `features/score-mockup` | Not found                  | fake model + variants                             | new — throwaway, deleted when the real HUD lands |
| kit `GameCard`          | draft cards                | compact cards in the mock hand                    | ride (read only)                                 |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size

M overall (engine model + balance + phases + saves + board + result/share + copy). This lap: S (docs + throwaway mockup).
Cut into laps: see DEVELOPMENT_PLAN § Follow-up laps (L1 engine model + balance, L2 HUD + juice + preview, L3 phases/result/share/copy, L4 cleanup).

## Decisions

DECISIONS.md D1–D9. Owner decisions still open: D2 (HUD variant), D4 (phase-4 goal conflict), D5 (end score), D8 (meter bars kept or removed).
