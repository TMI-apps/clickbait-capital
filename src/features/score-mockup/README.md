# score-mockup

Throwaway prototype for the score redesign lap (`documentation/jobs/temp_job_score-redesign/`). Not part of the game.

- **What:** one board-like screen on a fake momentum economy (`services/scoreMockupModel.ts`): Gebruikers and Geld move gradually by a trend that cards change; reputation is hidden until it enters the warning (< 40) or danger zone (< 25).
- **Variants:** `/mockup/score?v=a` two tickers + reputation guard, `?v=b` one Bedrijfswaarde with breakdown + hazard stripe, `?v=c` stock chart racing both numbers to the goal + red vignette. "Demo" plays a scripted run that chases growth into the danger zone and repairs it with news.
- **Boundaries:** imports only kit components and shared utils; never the game features. Route is unlinked and not in `PUBLIC_PATHS` (score-redesign D7).
- **Lifetime:** delete this feature, `src/pages/ScoreMockupPage.tsx` and the route when the real score HUD lands (DEVELOPMENT_PLAN L2).
