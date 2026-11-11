# score-chart

The stock-style score chart of the game board (score-redesign D10, D29): each score number as a line racing to its own dashed goal line, in its own colour.

## Purpose

Shows how the score moves over the last actions and how far it is from the goal. All series share one chart, but each has its own scale, so its dashed goal line sits at its own height, in the line's colour and labelled with the goal value in that colour (score-redesign D31): the colour says whose goal it is and the goals never sit on top of each other. The y axis covers the visible range (score-redesign D32): the lowest shown value sits just above the counters (68 % of the height), a share of 1 on the goal line, so small changes stay visible. A series' optional `forecast` share is drawn as a dashed segment from the newest point to a hollow dot in a reserved last x slot (`data-chart-forecast`), so the history never shifts when a forecast appears. `children` are laid over the chart (game-board puts the counters along its bottom). The chart is visual only (`aria-hidden`); the caller speaks the numbers.

## Structure

- `components/ScoreChart.tsx`: the SVG (per series a dashed goal line and a polyline, strokes with `vector-effect: non-scaling-stroke`) plus the end dots and goal labels as HTML at the left end of each goal line (the newest point is on the right), so they stay sharp while the SVG stretches.
- `hooks/useScoreChart.ts`: memoises the geometry.
- `services/scoreChart.ts`: pure geometry (`toChartGeometry(series, slots)`), unit-tested in `scoreChart.test.ts`.
- `types/scoreChart.types.ts`: `ScoreChartSeries`, `ChartGeometry`.
- `api/index.ts`: `ScoreChart` and its types.

## Dependencies

Theme token classes only (`text-meter-*`, `success`) and lucide icons. No game logic: game-board builds the series from the engine state (`MeterView.history`) and passes the slot count (`SCORE_HISTORY_POINTS`).
