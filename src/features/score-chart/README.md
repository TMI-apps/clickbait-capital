# score-chart

The stock-style score chart of the game board (score-redesign D10, D29): each score number as a line racing to its own dashed goal line, in its own colour.

## Purpose

Shows how the score moved over the whole run and how far it is from the goal. All series share one chart, but each has its own scale, so its dashed goal line sits at its own height, in the line's colour and labelled with the goal value in that colour (score-redesign D31): the colour says whose goal it is and the goals never sit on top of each other. The x axis is the whole run (chart-timeline D1, D2): turn 0 on the left edge, each turn a fixed step right (2/3 of the width over 12 turns) until the newest point would pass 2/3 of the width, then the scale compresses so the whole run fits in the left 2/3; the right third stays free for the forecast. `markers` (point indices, the phase starts) are drawn as subtle dashed vertical ticks (`data-chart-marker`, D3). Above 160 points a line is thinned to the lowest and highest point per bucket (D4). The y axis covers the whole run (score-redesign D32): the lowest shown value sits just above the counters (45 % of the height for the first series, 55 % for the second, so two lines at their low never cover each other and stay clear of a two-row counter on phones), a share of 1 on the goal line, so small changes stay visible. A series' optional `forecast` share is drawn as a dashed segment from the newest point to a hollow dot 1/6 of the width to its right (`data-chart-forecast`), in the free right part, so the history never shifts when a forecast appears. `children` are laid over the chart (game-board puts the counters along its bottom). The chart is visual only (`aria-hidden`); the caller speaks the numbers.

## Structure

- `components/ScoreChart.tsx`: the SVG (per series a dashed goal line and a polyline, strokes with `vector-effect: non-scaling-stroke`) plus the end dots and goal labels as HTML at the left end of each goal line (the newest point is on the right), so they stay sharp while the SVG stretches.
- `hooks/useScoreChart.ts`: memoises the geometry (pass a stable `series`; game-board memoises it).
- `services/scoreChart.ts`: pure geometry (`toChartGeometry(series, markers)`), unit-tested in `scoreChart.test.ts`.
- `types/scoreChart.types.ts`: `ScoreChartSeries`, `ChartGeometry`.
- `api/index.ts`: `ScoreChart` and its types.

## Dependencies

Theme token classes only (`text-meter-*`, `success`) and lucide icons. No game logic: game-board builds the series from the engine state (`MeterView.history`) and passes the phase starts (`MeterView.phaseStarts`) as markers.
