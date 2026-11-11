# score-chart

The stock-style score chart of the game board (score-redesign D10, D29; chart-timeline D1–D7; chart-origin D1–D2): each score number as a line racing to its own dashed goal line, in its own colour, over the whole run.

## Purpose

Shows how the score moved over the whole run and how far it is from the goal. All series share one chart, but each has its own scale from zero on the bottom edge to its dashed goal line at its own height (38 % and 54 % from the top, pushed lower so each label clears the measured overlay at the top, `goalTops`), in the line's colour and labelled with the goal value above the line at its left end (score-redesign D31, chart-timeline D6): the colour says whose goal it is and the goals never sit on top of each other. A line or forecast that rises past what fits above its goal shrinks its scale so its highest point stays just below the overlay at the top, so nothing hides behind the counters.

The x axis is the whole run (chart-timeline D1, D2): it starts at the launch origin, a zero point the chart puts in front of every series and draws in the bottom-left corner, so each line visibly rises from zero to its start value at turn 0, one step right (chart-origin D1; display only, `markers` keep their turn indices and are shifted with it). Each turn is a fixed step right (the history width over 12 turns) until the newest point would reach the free right part, then the scale compresses so the whole run fits. The free right part is as wide as the forecast needs at the measured width (`FORECAST_RESERVE_PX`, 112 px, clamped to 18–40 %, D5). `markers` are point indices: a `divider` (a phase start) is a dashed vertical line with its label ("F2") just above the bottom, and the line before the last divider is drawn faded and thinner; an `event` is a short tick on the bottom edge in its `tone` (`data-chart-marker`, D3). Above 160 points a line is thinned to the lowest and highest point per bucket (D4).

A series' optional `forecast` share is drawn as a dashed segment from the newest point to a hollow dot 24 px to its right (`data-chart-forecast`) with `forecastText` beside it in the line's colour (`data-chart-forecast-text`, D7; two labels closer than their height are spread apart), so the history never shifts when a forecast appears. `children` are laid over the top of the chart in a measured wrapper (game-board puts the counters in its corners, D6, and gives them the inset, so the plot runs to the panel's edges, chart-origin D2); only the goal and divider lines run behind them. The chart is visual only (`aria-hidden`); the caller speaks the numbers.

## Structure

- `components/ScoreChart.tsx`: the SVG (dividers, event ticks, per series a dashed goal line, the faded past and the current polyline, strokes with `vector-effect: non-scaling-stroke`) plus the end dots, forecast dots and labels, divider labels and goal labels as HTML, so they stay round and sharp while the SVG stretches.
- `hooks/useScoreChart.ts`: memoises the geometry (pass a stable `series`; game-board memoises it). `hooks/useElementSize.ts`: the measured chart and overlay size (`ResizeObserver`).
- `services/scoreChart.ts`: pure geometry (`toChartGeometry({ series, markers, widthPx, heightPx, topInsetPx })`, `reserveShare`, `goalTops`), unit-tested in `scoreChart.test.ts`.
- `types/scoreChart.types.ts`: `ScoreChartSeries`, `ChartMarker`, `ChartGeometry`.
- `api/index.ts`: `ScoreChart` and its types.

## Dependencies

Theme token classes only (`text-meter-*`, `muted-foreground`, `card`) and no chart library. No game logic: game-board builds the series from the engine state (`MeterView.history`, `DraftCardView.forecastText`) and the markers (`BoardView.scoreMarkers`).
