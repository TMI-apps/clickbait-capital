# Brief: chart-timeline

**Problem.** Player feedback (owner): the Gebruikers and Geld lines should start at the start of the run, so the whole timeline of the app shows instead of the last changes. The line starts on the left, moves right, and scales along once it is in the right 2/3, so there is always room for the forecast. Today the chart shows only the last 12 points of the current phase, spread over the width (score-redesign D18, D29).

**Success check.**

- The chart shows the whole run from turn 0; phase changes show as a subtle tick; the current phase's goal lines stay.
- Turn 1 starts at the left edge and each turn moves a fixed step right; once the newest point would pass 2/3 of the width, the x scale compresses so the whole run fits in the left 2/3; the right third stays free for the forecast.
- Y scaling per line over the whole run plus the goal; round dots, uniform strokes; forecast, goal lines, counters, juice keep working.
- 100+ turns stay readable and cheap (thinned path, memoised geometry).
- The chart stays `aria-hidden`; counters and turn announcements still speak.
- A reload keeps the full history (steps are rebuilt by replay; no save change).
- Preview at 390x844, 360x640, 1440x900: no errors, no document scroll.

**Round 2 (owner, via orchestrator).** The agent picks the forecast reserve from the room the forecast needs; zero at the bottom; earlier phases faded with labelled dividers and event ticks; the plot uses the full height behind the counters, which move to the top corners; a delta label at each forecast dot (D5–D7).

**In scope.** score-chart (geometry, component, types, README), game-board (`toScoreHistory`, `MeterView`, `MeterPanel`, README), decision log.

**Out of scope.** Hand drawing (feat/deck-draw), the save format, the engine.

**Size.** S.

## Plan

1. `toChartGeometry(series, markers)`: fixed step = (2/3 width) / 12 until 13 points, then the run compresses into the left 2/3; forecast dot 1/6 width right of the newest point; per-bucket min/max thinning above 160 points; phase tick x positions. Unit tests.
2. `toScoreHistory`: start values plus every step's state plus the current state, each with its phase; `MeterView.phaseStarts`; drop `SCORE_HISTORY_POINTS`.
3. `MeterPanel` memoises the series and passes the phase starts; `ScoreChart` draws the ticks.
4. READMEs, decision log; Playwright check on the preview.
