# score-mockup

Throwaway prototype for the score redesign lap (`documentation/jobs/temp_job_score-redesign/`). Not part of the game.

## Purpose

One board-like screen on a fake momentum economy: Gebruikers and Geld move gradually by a trend that cards change; reputation is hidden until it enters the warning (< 40) or danger zone (< 25). Three HUD variants let the owner compare designs:

- `/mockup/score?v=a`: two tickers and a reputation guard.
- `?v=b`: one Bedrijfswaarde with a breakdown and a hazard stripe.
- `?v=c`: a stock chart racing both numbers to the goal and a red vignette.

"Demo" plays a scripted run that chases growth into the danger zone and repairs it with news.

## Structure

- `services/scoreMockupModel.ts`: the fake model (turns, forecast, demo script), with its test.
- `services/scoreHudView.ts`, `services/scoreFormat.ts`: the view the variants render and Dutch number formatting.
- `hooks/`: run state (`useScoreMockup`), number tween (`useTweenedNumber`), danger shake.
- `components/`: `ScoreMockup` shell, `TickerHud` (A), `ValueHud` (B), `ChartHud` (C), feed and hand, `Sparkline`, `TrendChip`, `ReputationGuard`.
- `api/index.ts`: exports `ScoreMockup` for `src/pages/ScoreMockupPage.tsx`.

## Dependencies

Kit components (`GameCard`, `Button`) and `shared/utils/cn` only, never the game features. The route is unlinked and not in `PUBLIC_PATHS` (score-redesign D7).

## Lifetime

Delete this feature, `src/pages/ScoreMockupPage.tsx` and the route when the real score HUD lands (DEVELOPMENT_PLAN L2).
